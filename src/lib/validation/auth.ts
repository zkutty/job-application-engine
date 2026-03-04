import { z } from "zod";

export const AuthInputSchema = z.object({
  email: z.string().trim().email().max(200),
  password: z.string().min(8).max(128),
});
