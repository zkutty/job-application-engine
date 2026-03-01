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

export async function GET() {
  const stories = await prisma.story.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ stories }, { status: 200 });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as unknown;
    const parsed = StoryInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid story payload." },
        { status: 400 },
      );
    }

    const story = await prisma.story.create({ data: parsed.data });
    return NextResponse.json({ story }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create story." }, { status: 500 });
  }
}
