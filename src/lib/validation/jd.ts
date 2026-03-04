import { z } from "zod";

export const JdAnalysisSchema = z.object({
  roleTitleGuess: z.string().min(1),
  seniorityGuess: z.string().min(1),
  competencies: z.array(z.string().min(1)).max(8),
  keywords: z.array(z.string().min(1)).max(15),
  tools: z.array(z.string().min(1)).max(10),
});

export type JdAnalysis = z.infer<typeof JdAnalysisSchema>;
