import crypto from "node:crypto";

const RESET_TOKEN_TTL_MS = 1000 * 60 * 60;

export function createPasswordResetToken(): { token: string; tokenHash: string; expiresAt: Date } {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashPasswordResetToken(token);
  const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);
  return { token, tokenHash, expiresAt };
}

export function hashPasswordResetToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function buildPasswordResetUrl(request: Request, token: string): string {
  const url = new URL("/reset-password", request.url);
  url.searchParams.set("token", token);
  return url.toString();
}
