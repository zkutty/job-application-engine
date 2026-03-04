import { NextResponse } from "next/server";

import { requireUserId } from "@/lib/auth/requireUser";
import { prisma } from "@/lib/db/prisma";
import { analyzeJd } from "@/lib/jd/analyze";
import { resolveJobDescriptionInput } from "@/lib/jd/resolveInput";
import { generateCoverLetter } from "@/lib/openai/client";
import { postCheckCoverLetter } from "@/lib/safety/coverLetter";
import { selectTopStories } from "@/lib/stories/select";
import { CoverLetterInputSchema } from "@/lib/validation/coverLetter";

function parseStringArray(value: string): string[] {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function storyResultWithPlaceholder(result: string): string {
  const trimmed = result.trim();
  if (!trimmed) {
    return "[insert metric]";
  }

  return /\d/.test(trimmed) ? trimmed : `${trimmed} [insert metric]`;
}

export async function POST(request: Request) {
  const auth = await requireUserId(request);
  if (!auth.ok) return auth.response;

  try {
    const body = (await request.json()) as unknown;
    const parsed = CoverLetterInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request body." },
        { status: 400 },
      );
    }

    const resolvedJobDescription = await resolveJobDescriptionInput(parsed.data.jobDescription);

    const [profile, stories, jdSignals] = await Promise.all([
      prisma.candidateProfile.findFirst({ where: { userId: auth.userId } }),
      prisma.story.findMany({ where: { userId: auth.userId }, orderBy: { createdAt: "desc" } }),
      analyzeJd(resolvedJobDescription),
    ]);

    const candidateStories = stories.map((story) => ({
      id: story.id,
      title: story.title,
      situation: story.situation,
      action: story.action,
      result: story.result,
      tags: parseStringArray(story.tagsJson),
    }));

    const topStories = selectTopStories({
      stories: candidateStories,
      jdCompetencies: jdSignals.competencies,
      jdKeywords: jdSignals.keywords,
      limit: 2,
    }).map((story) => ({
      title: story.title,
      situation: story.situation,
      action: story.action,
      result: storyResultWithPlaceholder(story.result),
    }));

    const coverLetter = await generateCoverLetter({
      jobDescription: resolvedJobDescription,
      profileSummary: profile?.summary,
      voiceGuidelines: profile?.voiceGuidelines,
      selectedStories: topStories,
    });

    const checked = postCheckCoverLetter({
      coverLetter,
      sourceTexts: [
        resolvedJobDescription,
        profile?.summary ?? "",
        profile?.voiceGuidelines ?? "",
        ...topStories.flatMap((story) => [story.title, story.situation, story.action, story.result]),
      ],
      minWords: 250,
      maxWords: 350,
    });

    if (!checked.withinWordRange) {
      return NextResponse.json(
        {
          error: `Generated cover letter length (${checked.wordCount} words) is outside 250-350. Please retry.`,
        },
        { status: 422 },
      );
    }

    const record = await prisma.job.create({
      data: {
        jdText: resolvedJobDescription,
        company: jdSignals.companyGuess,
        title: jdSignals.roleTitleGuess,
        userId: auth.userId,
        artifacts: {
          create: {
            type: "cover_letter",
            content: checked.sanitizedCoverLetter,
          },
        },
      },
      select: {
        artifacts: {
          take: 1,
          orderBy: { createdAt: "desc" },
          select: { id: true, createdAt: true },
        },
      },
    });

    return NextResponse.json(
      {
        coverLetter: checked.sanitizedCoverLetter,
        artifactId: record.artifacts[0]?.id,
        createdAt: record.artifacts[0]?.createdAt,
      },
      { status: 200 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate cover letter.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
