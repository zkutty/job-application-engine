import { NextResponse } from "next/server";

import { cookieHeaderValue, createSession, verifyPassword } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { AuthInputSchema } from "@/lib/validation/auth";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as unknown;
    const parsed = AuthInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid login payload." },
        { status: 400 },
      );
    }

    const email = parsed.data.email.toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, passwordHash: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const isValid = await verifyPassword(parsed.data.password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const session = await createSession(user.id);

    return NextResponse.json(
      { user: { id: user.id, email: user.email } },
      {
        status: 200,
        headers: {
          "Set-Cookie": cookieHeaderValue(session.token, session.expiresAt),
        },
      },
    );
  } catch {
    return NextResponse.json({ error: "Failed to log in." }, { status: 500 });
  }
}
