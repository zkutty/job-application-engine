import { getOpenAIClient, OPENAI_MODEL } from "@/lib/openai/client";
import {
  buildQuestionBankMessages,
  QUESTION_BANK_JSON_SCHEMA,
  QuestionBankSchema,
  type BuildQuestionBankPromptInput,
  type QuestionBank,
} from "@/lib/prompts/questionBank";

export async function generateQuestionBank(input: BuildQuestionBankPromptInput): Promise<QuestionBank> {
  const client = getOpenAIClient();

  const response = await client.chat.completions.create({
    model: OPENAI_MODEL,
    temperature: 0.3,
    response_format: {
      type: "json_schema",
      json_schema: QUESTION_BANK_JSON_SCHEMA,
    },
    messages: buildQuestionBankMessages(input),
  });

  const content = response.choices[0]?.message?.content;

  if (!content) {
    throw new Error("OpenAI returned an empty question bank response.");
  }

  const parsed = JSON.parse(content) as unknown;
  return QuestionBankSchema.parse(parsed);
}
