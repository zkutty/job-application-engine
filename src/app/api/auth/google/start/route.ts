import crypto from "node:crypto";

import { NextResponse } from "next/server";

import { buildGoogleAuthUrl } from "@/lib/auth/google";

const GOOGLE_STATE_COOKIE = "jae_google_oauth_state";

function oauthStateCookieValue(state: string): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${GOOGLE_STATE_COOKIE}=${encodeURIComponent(state)}; Path=/api/auth/google; HttpOnly; SameSite=Lax; Max-Age=600${secure}`;
}

export async function GET(request: Request) {
  try {
    const state = crypto.randomBytes(24).toString("hex");
    const authUrl = buildGoogleAuthUrl(request, state);

    return NextResponse.redirect(authUrl, {
      status: 302,
      headers: { "Set-Cookie": oauthStateCookieValue(state) },
    });
  } catch {
    return NextResponse.redirect(new URL("/login?error=Google%20sign-in%20is%20not%20configured.", request.url));
  }
}
