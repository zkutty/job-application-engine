import { NextResponse } from "next/server";

import { hashPasswordResetToken } from "@/lib/auth/passwordReset";
import { hashPassword } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { PasswordResetConfirmSchema } from "@/lib/validation/auth";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as unknown;
    const parsed = PasswordResetConfirmSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid password reset payload." },
        { status: 400 },
      );
    }

    const tokenHash = hashPasswordResetToken(parsed.data.token);
    const resetRecord = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      select: { id: true, userId: true, expiresAt: true },
    });

    if (!resetRecord || resetRecord.expiresAt.getTime() <= Date.now()) {
      if (resetRecord) {
        await prisma.passwordResetToken.delete({ where: { id: resetRecord.id } });
      }

      return NextResponse.json({ error: "Invalid or expired password reset link." }, { status: 400 });
    }

    const newPasswordHash = await hashPassword(parsed.data.password);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetRecord.userId },
        data: { passwordHash: newPasswordHash },
      }),
      prisma.passwordResetToken.deleteMany({ where: { userId: resetRecord.userId } }),
      prisma.session.deleteMany({ where: { userId: resetRecord.userId } }),
    ]);

    return NextResponse.json({ message: "Password updated. You can now sign in." });
  } catch {
    return NextResponse.json({ error: "Failed to reset password." }, { status: 500 });
  }
}
