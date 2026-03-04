import { NextResponse } from "next/server";

import { requireUserId } from "@/lib/auth/requireUser";
import { prisma } from "@/lib/db/prisma";
import { ProfileUpsertSchema } from "@/lib/validation/profile";

export async function GET(request: Request) {
  const auth = await requireUserId(request);
  if (!auth.ok) return auth.response;

  const profile = await prisma.candidateProfile.findFirst({
    where: { userId: auth.userId },
  });

  return NextResponse.json({ profile }, { status: 200 });
}

export async function PUT(request: Request) {
  const auth = await requireUserId(request);
  if (!auth.ok) return auth.response;

  try {
    const body = (await request.json()) as unknown;
    const parsed = ProfileUpsertSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid profile payload." },
        { status: 400 },
      );
    }

    const existing = await prisma.candidateProfile.findFirst({ where: { userId: auth.userId } });

    const profile = existing
      ? await prisma.candidateProfile.update({
          where: { id: existing.id },
          data: parsed.data,
        })
      : await prisma.candidateProfile.create({ data: { ...parsed.data, userId: auth.userId } });

    return NextResponse.json({ profile }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Failed to save profile." }, { status: 500 });
  }
}
