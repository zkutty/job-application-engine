import OpenAI from "openai";

type StoryPromptInput = {
  title: string;
  situation: string;
  action: string;
  result: string;
};

type BuildCoverLetterPromptInput = {
  jobDescription: string;
  profileSummary?: string;
  voiceGuidelines?: string;
  selectedStories?: StoryPromptInput[];
  retryContext?: {
    attemptNumber: number;
    previousWordCount: number;
    minWords: number;
    maxWords: number;
  };
};

export function buildCoverLetterMessages(
  input: BuildCoverLetterPromptInput,
): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
  const systemPrompt = [
    "You are an expert career writing assistant.",
    "Write a professional cover letter tailored to the provided job description.",
    "Mirror the job description language and priorities, but do not copy more than 8 consecutive words from the JD.",
    "Use a clear and concise tone.",
    "Do not invent candidate metrics or achievements.",
    "If a metric is missing in provided context, use [insert metric] placeholders.",
    "Target 250-350 words.",
    "Use exactly 3 paragraphs and optional bullets when helpful.",
    "Return only the cover letter text.",
  ].join(" ");

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

  const userPrompt = [
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
    "",
    "Generate the cover letter now.",
  ].join("\n");

  const retryPrompt = input.retryContext
    ? [
        "Revision request:",
        `This is attempt ${input.retryContext.attemptNumber}.`,
        `Your previous draft was ${input.retryContext.previousWordCount} words.`,
        `Rewrite to be between ${input.retryContext.minWords} and ${input.retryContext.maxWords} words.`,
        "Aim for about 300 words while preserving factual accuracy and placeholders.",
      ].join("\n")
    : null;

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

  if (retryPrompt) {
    messages.push({ role: "user", content: retryPrompt });
  }

  return messages;
}
