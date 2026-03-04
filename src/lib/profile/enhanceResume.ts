import { getOpenAIClient, OPENAI_MODEL } from "@/lib/openai/client";
import { ResumeEnhancementSchema, type ResumeEnhancement } from "@/lib/validation/profile";

type EnhanceResumeInput = {
  rawResumeText: string;
  targetRole?: string;
};

export async function enhanceResumeText(input: EnhanceResumeInput): Promise<ResumeEnhancement> {
  const client = getOpenAIClient();

  const response = await client.chat.completions.create({
    model: OPENAI_MODEL,
    temperature: 0.2,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "resume_enhancement",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            topFeedback: {
              type: "array",
              minItems: 3,
              maxItems: 6,
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  feedback: { type: "string" },
                  reason: { type: "string" },
                },
                required: ["feedback", "reason"],
              },
            },
            rewritePlan: {
              type: "array",
              minItems: 3,
              maxItems: 8,
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  section: { type: "string" },
                  rewriteDirection: { type: "string" },
                  why: { type: "string" },
                },
                required: ["section", "rewriteDirection", "why"],
              },
            },
            rewrittenResume: { type: "string" },
          },
          required: ["topFeedback", "rewritePlan", "rewrittenResume"],
        },
      },
    },
    messages: [
      {
        role: "system",
        content: [
          "You are a resume editor.",
          "Return top feedback, a concrete rewrite plan, and a rewritten resume.",
          "Never invent employers, dates, titles, or metrics.",
          "If a metric is missing, keep placeholders like [insert metric].",
          "Optimize for one US letter page. Target roughly 420-650 words.",
          "Use clear section headers and bullet points for experience impact.",
          "Keep rewritten text concise and professional.",
          "Return valid JSON only.",
        ].join(" "),
      },
      {
        role: "user",
        content: [
          input.targetRole ? `Target role: ${input.targetRole}` : "Target role: not specified",
          "Resume text:",
          input.rawResumeText,
        ].join("\n\n"),
      },
    ],
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI returned an empty resume enhancement response.");
  }

  return ResumeEnhancementSchema.parse(JSON.parse(content) as unknown);
}
