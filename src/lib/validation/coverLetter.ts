import { z } from "zod";

export const CoverLetterInputSchema = z.object({
  jobDescription: z
    .string()
    .trim()
    .min(40, "Please provide at least 40 characters of job description text."),
});

export type CoverLetterInput = z.infer<typeof CoverLetterInputSchema>;
