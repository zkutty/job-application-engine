import { z } from "zod";

import { getOpenAIClient, OPENAI_MODEL } from "@/lib/openai/client";
import { JdAnalysisSchema, type JdAnalysis } from "@/lib/validation/jd";

const JdAnalyzeInputSchema = z.object({
  jdText: z
    .string()
    .trim()
    .min(40, "Please provide at least 40 characters of job description text."),
});

function normalizeList(items: string[], max: number): string[] {
  const cleaned = items
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => item.replace(/\s+/g, " "));

  return Array.from(new Set(cleaned)).slice(0, max);
}

function normalizeAnalysis(data: JdAnalysis): JdAnalysis {
  return {
    roleTitleGuess: data.roleTitleGuess.trim(),
    seniorityGuess: data.seniorityGuess.trim(),
    competencies: normalizeList(data.competencies, 8),
    keywords: normalizeList(data.keywords, 15),
    tools: normalizeList(data.tools, 10),
  };
}

export async function analyzeJd(jdText: string): Promise<JdAnalysis> {
  const parsedInput = JdAnalyzeInputSchema.parse({ jdText });

  const client = getOpenAIClient();

  const response = await client.chat.completions.create({
    model: OPENAI_MODEL,
    temperature: 0,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "jd_analysis",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            roleTitleGuess: { type: "string" },
            seniorityGuess: { type: "string" },
            competencies: {
              type: "array",
              items: { type: "string" },
              maxItems: 8,
            },
            keywords: {
              type: "array",
              items: { type: "string" },
              maxItems: 15,
            },
            tools: {
              type: "array",
              items: { type: "string" },
              maxItems: 10,
            },
          },
          required: ["roleTitleGuess", "seniorityGuess", "competencies", "keywords", "tools"],
        },
      },
    },
    messages: [
      {
        role: "system",
        content:
          "Extract structured signals from a job description. Return only valid JSON matching the schema.",
      },
      {
        role: "user",
        content: [
          "Analyze the following job description and extract role title, seniority, competencies, keywords, and tools.",
          "Prefer concise phrases and avoid duplicates.",
          "",
          parsedInput.jdText,
        ].join("\n"),
      },
    ],
  });

  const content = response.choices[0]?.message?.content;

  if (!content) {
    throw new Error("OpenAI returned an empty JD analysis response.");
  }

  const parsedJson = JSON.parse(content) as unknown;
  const validated = JdAnalysisSchema.parse(parsedJson);

  return normalizeAnalysis(validated);
}
