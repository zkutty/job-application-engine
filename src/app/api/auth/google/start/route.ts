import { NextResponse } from "next/server";

import { buildGoogleAuthUrl, createSignedGoogleOAuthState, resolvePublicOrigin } from "@/lib/auth/google";

export async function GET(request: Request) {
  try {
    const state = createSignedGoogleOAuthState();
    const authUrl = buildGoogleAuthUrl(request, state);

    return NextResponse.redirect(authUrl, { status: 302 });
  } catch {
    return NextResponse.redirect(
      new URL("/login?error=Google%20sign-in%20is%20not%20configured.", resolvePublicOrigin(request)),
    );
  }
}
