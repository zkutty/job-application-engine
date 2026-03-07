import crypto from "node:crypto";

import { prisma } from "@/lib/db/prisma";

export const SESSION_COOKIE_NAME = "jae_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;

function parseCookies(rawCookieHeader: string | null): Map<string, string> {
  const cookies = new Map<string, string>();
  if (!rawCookieHeader) return cookies;

  for (const part of rawCookieHeader.split(";")) {
    const [key, ...valueParts] = part.trim().split("=");
    if (!key) continue;
    cookies.set(key, decodeURIComponent(valueParts.join("=")));
  }

  return cookies;
}

export function getCookieValue(rawCookieHeader: string | null, key: string): string | null {
  return parseCookies(rawCookieHeader).get(key) ?? null;
}

export function extractSessionToken(request: Request): string | null {
  const cookies = parseCookies(request.headers.get("cookie"));
  const token = cookies.get(SESSION_COOKIE_NAME);
  return token?.trim() ? token : null;
}

export async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString("hex");
    crypto.scrypt(password, salt, 64, (error, derivedKey) => {
      if (error) return reject(error);
      resolve(`${salt}:${derivedKey.toString("hex")}`);
    });
  });
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [salt, storedKey] = storedHash.split(":");
  if (!salt || !storedKey) return false;

  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (error, derivedKey) => {
      if (error) return reject(error);
      const derivedHex = derivedKey.toString("hex");
      const a = Buffer.from(derivedHex, "hex");
      const b = Buffer.from(storedKey, "hex");
      if (a.length !== b.length) return resolve(false);
      resolve(crypto.timingSafeEqual(a, b));
    });
  });
}

export async function createSession(userId: number): Promise<{ token: string; expiresAt: Date }> {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await prisma.session.create({
    data: {
      token,
      userId,
      expiresAt,
    },
  });

  return { token, expiresAt };
}

export async function destroySession(token: string): Promise<void> {
  await prisma.session.deleteMany({ where: { token } });
}

export async function getUserIdFromRequest(request: Request): Promise<number | null> {
  const token = extractSessionToken(request);
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    select: { id: true, userId: true, expiresAt: true },
  });

  if (!session) return null;

  if (session.expiresAt.getTime() <= Date.now()) {
    await prisma.session.delete({ where: { id: session.id } });
    return null;
  }

  return session.userId;
}

export function cookieHeaderValue(token: string, expiresAt: Date): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Expires=${expiresAt.toUTCString()}${secure}`;
}

export function clearCookieHeaderValue(): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}
