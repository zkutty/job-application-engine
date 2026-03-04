import { NextResponse } from "next/server";

import { requireUserId } from "@/lib/auth/requireUser";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: Request) {
  const auth = await requireUserId(request);
  if (!auth.ok) return auth.response;

  try {
    const history = await prisma.artifact.findMany({
      where: { type: "cover_letter", job: { userId: auth.userId } },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        createdAt: true,
        job: {
          select: {
            jdText: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        history: history.map((item) => ({
          id: item.id,
          createdAt: item.createdAt,
          jdPreview: item.job.jdText.slice(0, 80),
        })),
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json({ error: "Failed to load history." }, { status: 500 });
  }
}
