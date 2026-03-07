import { NextResponse } from "next/server";

import { buildPasswordResetUrl, createPasswordResetToken } from "@/lib/auth/passwordReset";
import { prisma } from "@/lib/db/prisma";
import { PasswordResetRequestSchema } from "@/lib/validation/auth";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as unknown;
    const parsed = PasswordResetRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid password reset request." },
        { status: 400 },
      );
    }

    const email = parsed.data.email.toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, passwordHash: true },
    });

    let resetUrl: string | undefined;

    if (user?.passwordHash) {
      const { token, tokenHash, expiresAt } = createPasswordResetToken();

      await prisma.$transaction([
        prisma.passwordResetToken.deleteMany({ where: { userId: user.id } }),
        prisma.passwordResetToken.create({
          data: {
            userId: user.id,
            tokenHash,
            expiresAt,
          },
        }),
      ]);

      resetUrl = buildPasswordResetUrl(request, token);
    }

    return NextResponse.json({
      message: "If an account exists for that email, a password reset link is ready.",
      resetUrl: process.env.NODE_ENV === "production" ? undefined : resetUrl,
    });
  } catch {
    return NextResponse.json({ error: "Failed to process password reset request." }, { status: 500 });
  }
}
