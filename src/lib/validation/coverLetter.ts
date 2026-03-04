import { z } from "zod";

export const CoverLetterInputSchema = z.object({
  jobDescription: z.string().trim().min(1, "Please provide a job description or a job URL."),
});

export type CoverLetterInput = z.infer<typeof CoverLetterInputSchema>;
