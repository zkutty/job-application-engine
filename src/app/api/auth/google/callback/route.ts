import { NextResponse } from "next/server";

import { exchangeCodeForAccessToken, fetchGoogleProfile, resolvePublicOrigin } from "@/lib/auth/google";
import { cookieHeaderValue, createSession, getCookieValue } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

const GOOGLE_STATE_COOKIE = "jae_google_oauth_state";

function clearOAuthStateCookie(): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${GOOGLE_STATE_COOKIE}=; Path=/api/auth/google; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}

function redirectToLogin(request: Request, error: string): NextResponse {
  const url = new URL("/login", resolvePublicOrigin(request));
  url.searchParams.set("error", error);

  return NextResponse.redirect(url, {
    status: 302,
    headers: { "Set-Cookie": clearOAuthStateCookie() },
  });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const oauthError = url.searchParams.get("error");

  if (oauthError) {
    return redirectToLogin(request, "Google sign-in was cancelled.");
  }

  const state = url.searchParams.get("state");
  const code = url.searchParams.get("code");
  const expectedState = getCookieValue(request.headers.get("cookie"), GOOGLE_STATE_COOKIE);

  if (!state || !expectedState || state !== expectedState || !code) {
    return redirectToLogin(request, "Google sign-in could not be validated.");
  }

  try {
    const accessToken = await exchangeCodeForAccessToken(request, code);
    const profile = await fetchGoogleProfile(accessToken);

    if (profile.email_verified === false) {
      return redirectToLogin(request, "Google account email is not verified.");
    }

    const normalizedEmail = profile.email.toLowerCase();
    const userModel = prisma.user as unknown as {
      findUnique: (args: unknown) => Promise<{ id: number; email?: string; googleSub?: string | null } | null>;
      update: (args: unknown) => Promise<{ id: number }>;
      create: (args: unknown) => Promise<{ id: number }>;
    };

    const [userByGoogleSub, userByEmail] = await Promise.all([
      userModel.findUnique({ where: { googleSub: profile.sub }, select: { id: true, email: true } }),
      userModel.findUnique({ where: { email: normalizedEmail }, select: { id: true, googleSub: true } }),
    ]);

    if (userByGoogleSub && userByEmail && userByGoogleSub.id !== userByEmail.id) {
      return redirectToLogin(request, "That email is already linked to another account.");
    }

    if (userByEmail?.googleSub && userByEmail.googleSub !== profile.sub) {
      return redirectToLogin(request, "This account is linked to a different Google profile.");
    }

    const user =
      userByGoogleSub ??
      (userByEmail
        ? await userModel.update({
            where: { id: userByEmail.id },
            data: { googleSub: userByEmail.googleSub ?? profile.sub },
            select: { id: true },
          })
        : await userModel.create({
            data: {
              email: normalizedEmail,
              googleSub: profile.sub,
            },
            select: { id: true },
          }));

    const session = await createSession(user.id);

    const response = NextResponse.redirect(new URL("/", resolvePublicOrigin(request)), { status: 302 });
    response.headers.append("Set-Cookie", clearOAuthStateCookie());
    response.headers.append("Set-Cookie", cookieHeaderValue(session.token, session.expiresAt));
    return response;
  } catch {
    return redirectToLogin(request, "Google sign-in failed. Please try again.");
  }
}
