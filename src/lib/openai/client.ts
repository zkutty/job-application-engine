import OpenAI from "openai";

import { buildCoverLetterMessages } from "@/lib/prompts/coverLetter";

export const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";

export function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY. Add it to your .env.local file.");
  }

  return new OpenAI({ apiKey });
}

type GenerateCoverLetterInput = {
  jobDescription: string;
  profileSummary?: string;
  voiceGuidelines?: string;
  selectedStories?: Array<{
    title: string;
    situation: string;
    action: string;
    result: string;
  }>;
  retryContext?: {
    attemptNumber: number;
    previousWordCount: number;
    minWords: number;
    maxWords: number;
  };
};

export async function generateCoverLetter(input: GenerateCoverLetterInput): Promise<string> {
  const client = getOpenAIClient();
  const messages = buildCoverLetterMessages(input);

  const response = await client.chat.completions.create({
    model: OPENAI_MODEL,
    messages,
    temperature: 0.4,
  });

  const content = response.choices[0]?.message?.content?.trim();

  if (!content) {
    throw new Error("OpenAI returned an empty response.");
  }

  return content;
}
