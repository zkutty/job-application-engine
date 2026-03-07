import { z } from "zod";

export const AuthInputSchema = z.object({
  email: z.string().trim().email().max(200),
  password: z.string().min(8).max(128),
});

export const PasswordResetRequestSchema = z.object({
  email: z.string().trim().email().max(200),
});

export const PasswordResetConfirmSchema = z.object({
  token: z.string().trim().min(32).max(512),
  password: z.string().min(8).max(128),
});
