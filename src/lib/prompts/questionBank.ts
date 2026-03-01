import OpenAI from "openai";
import { z } from "zod";

type StoryPromptInput = {
  title: string;
  situation: string;
  action: string;
  result: string;
};

export type BuildQuestionBankPromptInput = {
  jobDescription: string;
  profileSummary?: string;
  voiceGuidelines?: string;
  selectedStories?: StoryPromptInput[];
};

export const QuestionBankSchema = z.object({
  whyCompany: z.string().min(1),
  whyRole: z.string().min(1),
  campaignExample: z.string().min(1),
  conversionImprovement: z.string().min(1),
  crossFunctionalConflict: z.string().min(1),
  failureLearning: z.string().min(1),
  prioritization: z.string().min(1),
  kpiMeasurement: z.string().min(1),
});

export type QuestionBank = z.infer<typeof QuestionBankSchema>;

export const QUESTION_BANK_JSON_SCHEMA = {
  name: "question_bank_answers",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      whyCompany: { type: "string" },
      whyRole: { type: "string" },
      campaignExample: { type: "string" },
      conversionImprovement: { type: "string" },
      crossFunctionalConflict: { type: "string" },
      failureLearning: { type: "string" },
      prioritization: { type: "string" },
      kpiMeasurement: { type: "string" },
    },
    required: [
      "whyCompany",
      "whyRole",
      "campaignExample",
      "conversionImprovement",
      "crossFunctionalConflict",
      "failureLearning",
      "prioritization",
      "kpiMeasurement",
    ],
  },
} as const;

export function buildQuestionBankMessages(
  input: BuildQuestionBankPromptInput,
): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
  const profileSummary = input.profileSummary?.trim() || "No profile summary provided.";
  const voiceGuidelines = input.voiceGuidelines?.trim() || "No voice guidelines provided.";
  const selectedStories =
    input.selectedStories && input.selectedStories.length > 0
      ? input.selectedStories
          .map((story, index) =>
            [
              `Story ${index + 1}: ${story.title}`,
              `Situation: ${story.situation}`,
              `Action: ${story.action}`,
              `Result: ${story.result}`,
            ].join("\n"),
          )
          .join("\n\n")
      : "No matching stories provided.";

  return [
    {
      role: "system",
      content: [
        "You are an expert job application writing assistant.",
        "Generate concise, interview-ready answers for the required question bank.",
        "Do not hallucinate metrics, impact, or facts.",
        "If a metric is missing, keep [insert metric] in the answer.",
        "Return only JSON matching the provided schema.",
      ].join(" "),
    },
    {
      role: "user",
      content: [
        "Create answers for these questions:",
        "1) Why company",
        "2) Why role",
        "3) Campaign example",
        "4) Conversion improvement",
        "5) Cross-functional conflict",
        "6) Failure/learning",
        "7) Prioritization",
        "8) KPI/measurement",
        "",
        "Candidate profile summary:",
        profileSummary,
        "",
        "Voice guidelines:",
        voiceGuidelines,
        "",
        "Selected stories:",
        selectedStories,
        "",
        "Job description:",
        input.jobDescription.trim(),
      ].join("\n"),
    },
  ];
}

export function questionBankToMarkdown(questionBank: QuestionBank): string {
  return [
    "# Question Bank",
    "",
    "## Why company",
    questionBank.whyCompany,
    "",
    "## Why role",
    questionBank.whyRole,
    "",
    "## Campaign example",
    questionBank.campaignExample,
    "",
    "## Conversion improvement",
    questionBank.conversionImprovement,
    "",
    "## Cross-functional conflict",
    questionBank.crossFunctionalConflict,
    "",
    "## Failure/learning",
    questionBank.failureLearning,
    "",
    "## Prioritization",
    questionBank.prioritization,
    "",
    "## KPI/measurement",
    questionBank.kpiMeasurement,
    "",
  ].join("\n");
}
