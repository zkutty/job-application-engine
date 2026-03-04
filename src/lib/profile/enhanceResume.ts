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
            suggestions: {
              type: "array",
              items: { type: "string" },
              minItems: 3,
              maxItems: 8,
            },
            rewrittenResume: { type: "string" },
          },
          required: ["suggestions", "rewrittenResume"],
        },
      },
    },
    messages: [
      {
        role: "system",
        content: [
          "You are a resume editor.",
          "Return concrete, high-impact suggestions and a rewritten resume.",
          "Never invent employers, dates, titles, or metrics.",
          "If a metric is missing, keep placeholders like [insert metric].",
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
