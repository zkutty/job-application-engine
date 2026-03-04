import { NextResponse } from "next/server";

import { clearCookieHeaderValue, destroySession, extractSessionToken } from "@/lib/auth/session";

export async function POST(request: Request) {
  try {
    const token = extractSessionToken(request);
    if (token) {
      await destroySession(token);
    }

    return NextResponse.json(
      { ok: true },
      {
        status: 200,
        headers: {
          "Set-Cookie": clearCookieHeaderValue(),
        },
      },
    );
  } catch {
    return NextResponse.json({ error: "Failed to log out." }, { status: 500 });
  }
}
