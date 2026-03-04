import { z } from "zod";

export const ImportedProfileSchema = z.object({
  name: z.string().trim().min(1),
  headline: z.string().trim().min(1),
  summary: z.string().trim().min(1),
  skills: z.array(z.string().trim().min(1)).default([]),
  voiceGuidelines: z.string().trim().min(1),
  metricsInventory: z.array(z.string().trim().min(1)).default([]),
});

export type ImportedProfile = z.infer<typeof ImportedProfileSchema>;

export const ProfileUpsertSchema = z.object({
  name: z.string().trim().min(1),
  headline: z.string().trim().min(1),
  summary: z.string().trim().min(1),
  skillsJson: z.string().trim().min(2),
  voiceGuidelines: z.string().trim().min(1),
  profileJson: z.string().trim().optional(),
  rawResumeText: z.string().trim().optional(),
});

export type ProfileUpsertInput = z.infer<typeof ProfileUpsertSchema>;

export const ResumeEnhancementRequestSchema = z.object({
  rawResumeText: z.string().trim().min(40),
  targetRole: z.string().trim().max(140).optional(),
});

export const ResumeEnhancementSchema = z.object({
  topFeedback: z
    .array(
      z.object({
        feedback: z.string().trim().min(1),
        reason: z.string().trim().min(1),
      }),
    )
    .min(3)
    .max(6),
  rewritePlan: z
    .array(
      z.object({
        section: z.string().trim().min(1),
        rewriteDirection: z.string().trim().min(1),
        why: z.string().trim().min(1),
      }),
    )
    .min(3)
    .max(8),
  rewrittenResume: z.string().trim().min(120),
});

export type ResumeEnhancementRequest = z.infer<typeof ResumeEnhancementRequestSchema>;
export type ResumeEnhancement = z.infer<typeof ResumeEnhancementSchema>;
