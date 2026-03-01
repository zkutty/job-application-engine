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
