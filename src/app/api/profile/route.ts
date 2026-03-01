import { NextResponse } from "next/server";

import { prisma } from "@/lib/db/prisma";
import { ProfileUpsertSchema } from "@/lib/validation/profile";

export async function GET() {
  const profile = await prisma.candidateProfile.findFirst({
    orderBy: { id: "asc" },
  });

  return NextResponse.json({ profile }, { status: 200 });
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as unknown;
    const parsed = ProfileUpsertSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid profile payload." },
        { status: 400 },
      );
    }

    const existing = await prisma.candidateProfile.findFirst({ orderBy: { id: "asc" } });

    const profile = existing
      ? await prisma.candidateProfile.update({
          where: { id: existing.id },
          data: parsed.data,
        })
      : await prisma.candidateProfile.create({ data: parsed.data });

    return NextResponse.json({ profile }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Failed to save profile." }, { status: 500 });
  }
}
