import { NextResponse } from "next/server";

import { requireUserId } from "@/lib/auth/requireUser";
import { prisma } from "@/lib/db/prisma";
import { analyzeJd } from "@/lib/jd/analyze";
import { resolveJobDescriptionInput } from "@/lib/jd/resolveInput";
import { generateQuestionBank } from "@/lib/question-bank/generate";
import { questionBankToMarkdown } from "@/lib/prompts/questionBank";
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

export async function GET(request: Request) {
  const auth = await requireUserId(request);
  if (!auth.ok) return auth.response;

  try {
    const artifacts = await prisma.artifact.findMany({
      where: { type: "question_bank", job: { userId: auth.userId } },
      orderBy: { createdAt: "desc" },
      take: 25,
      select: {
        id: true,
        createdAt: true,
        content: true,
        job: {
          select: {
            id: true,
            company: true,
            title: true,
            jdText: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        questionBanks: artifacts.map((artifact) => ({
          artifactId: artifact.id,
          createdAt: artifact.createdAt,
          markdown: artifact.content,
          jobId: artifact.job.id,
          company: artifact.job.company ?? "Unknown Company",
          roleTitle: artifact.job.title ?? "Untitled Role",
          displayName: `${artifact.job.company ?? "Unknown Company"} - ${artifact.job.title ?? "Untitled Role"}`,
          jdPreview: artifact.job.jdText.slice(0, 120),
          jdText: artifact.job.jdText,
        })),
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json({ error: "Failed to load saved question banks." }, { status: 500 });
  }
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

    const questionBank = await generateQuestionBank({
      jobDescription: resolvedJobDescription,
      profileSummary: profile?.summary,
      voiceGuidelines: profile?.voiceGuidelines,
      selectedStories: topStories,
    });

    const markdown = questionBankToMarkdown(questionBank);

    const record = await prisma.job.create({
      data: {
        jdText: resolvedJobDescription,
        company: jdSignals.companyGuess,
        title: jdSignals.roleTitleGuess,
        userId: auth.userId,
        artifacts: {
          create: {
            type: "question_bank",
            content: markdown,
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
        markdown,
        questionBank,
        company: jdSignals.companyGuess,
        roleTitle: jdSignals.roleTitleGuess,
        artifactId: record.artifacts[0]?.id,
        createdAt: record.artifacts[0]?.createdAt,
      },
      { status: 200 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate question bank.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
