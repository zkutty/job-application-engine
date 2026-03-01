import { NextResponse } from "next/server";

import { prisma } from "@/lib/db/prisma";
import { analyzeJd } from "@/lib/jd/analyze";
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

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as unknown;
    const parsed = CoverLetterInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request body." },
        { status: 400 },
      );
    }

    const [profile, stories, jdSignals] = await Promise.all([
      prisma.candidateProfile.findFirst({ orderBy: { id: "asc" } }),
      prisma.story.findMany({ orderBy: { createdAt: "desc" } }),
      analyzeJd(parsed.data.jobDescription),
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
      jobDescription: parsed.data.jobDescription,
      profileSummary: profile?.summary,
      voiceGuidelines: profile?.voiceGuidelines,
      selectedStories: topStories,
    });

    const markdown = questionBankToMarkdown(questionBank);

    const record = await prisma.job.create({
      data: {
        jdText: parsed.data.jobDescription,
        title: jdSignals.roleTitleGuess,
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
