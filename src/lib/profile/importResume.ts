import pdfParse from "pdf-parse";

import { getOpenAIClient, OPENAI_MODEL } from "@/lib/openai/client";
import { ImportedProfileSchema, type ImportedProfile } from "@/lib/validation/profile";

export async function extractPdfText(fileBuffer: Buffer): Promise<string> {
  const result = await pdfParse(fileBuffer);
  return result.text.trim();
}

function normalizeProfile(profile: ImportedProfile): ImportedProfile {
  return {
    ...profile,
    skills: Array.from(new Set(profile.skills.map((s) => s.trim()).filter(Boolean))),
    metricsInventory: Array.from(new Set(profile.metricsInventory.map((m) => m.trim()).filter(Boolean))),
  };
}

export async function parseProfileFromResumeText(rawResumeText: string): Promise<ImportedProfile> {
  const client = getOpenAIClient();

  const response = await client.chat.completions.create({
    model: OPENAI_MODEL,
    temperature: 0,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "imported_profile",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            name: { type: "string" },
            headline: { type: "string" },
            summary: { type: "string" },
            skills: { type: "array", items: { type: "string" } },
            voiceGuidelines: { type: "string" },
            metricsInventory: { type: "array", items: { type: "string" } },
          },
          required: ["name", "headline", "summary", "skills", "voiceGuidelines", "metricsInventory"],
        },
      },
    },
    messages: [
      {
        role: "system",
        content: [
          "Extract and normalize a candidate profile from resume text.",
          "Do not hallucinate metrics, achievements, or facts.",
          "metricsInventory must only include metrics explicitly present in resume text.",
          "If metric details are implied but missing, use placeholders like [insert metric].",
          "Return valid JSON only.",
        ].join(" "),
      },
      {
        role: "user",
        content: rawResumeText,
      },
    ],
  });

  const content = response.choices[0]?.message?.content;

  if (!content) {
    throw new Error("OpenAI returned an empty profile import response.");
  }

  const parsed = JSON.parse(content) as unknown;
  return normalizeProfile(ImportedProfileSchema.parse(parsed));
}
