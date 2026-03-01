import { NextResponse } from "next/server";

import { prisma } from "@/lib/db/prisma";

export async function GET() {
  try {
    const history = await prisma.artifact.findMany({
      where: { type: "cover_letter" },
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
