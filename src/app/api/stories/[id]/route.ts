import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db/prisma";

const StoryInputSchema = z.object({
  title: z.string().trim().min(1),
  situation: z.string().trim().min(1),
  action: z.string().trim().min(1),
  result: z.string().trim().min(1),
  tagsJson: z.string().trim().min(2),
});

function parseId(params: { id: string }): number | null {
  const id = Number(params.id);
  return Number.isInteger(id) && id > 0 ? id : null;
}

type StoryRouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(
  request: Request,
  { params }: StoryRouteContext,
) {
  const id = parseId(await params);
  if (!id) {
    return NextResponse.json({ error: "Invalid story id." }, { status: 400 });
  }

  try {
    const body = (await request.json()) as unknown;
    const parsed = StoryInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid story payload." },
        { status: 400 },
      );
    }

    const story = await prisma.story.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json({ story }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Failed to update story." }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: StoryRouteContext,
) {
  const id = parseId(await params);
  if (!id) {
    return NextResponse.json({ error: "Invalid story id." }, { status: 400 });
  }

  try {
    await prisma.story.delete({ where: { id } });
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Failed to delete story." }, { status: 500 });
  }
}
