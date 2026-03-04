import { NextResponse } from "next/server";

import { cookieHeaderValue, createSession, hashPassword } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { AuthInputSchema } from "@/lib/validation/auth";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as unknown;
    const parsed = AuthInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid registration payload." },
        { status: 400 },
      );
    }

    const email = parsed.data.email.toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) {
      return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
    }

    const passwordHash = await hashPassword(parsed.data.password);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
      },
      select: { id: true, email: true },
    });

    const session = await createSession(user.id);

    return NextResponse.json(
      { user },
      {
        status: 201,
        headers: {
          "Set-Cookie": cookieHeaderValue(session.token, session.expiresAt),
        },
      },
    );
  } catch {
    return NextResponse.json({ error: "Failed to create account." }, { status: 500 });
  }
}
