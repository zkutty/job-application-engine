import { NextResponse } from "next/server";
import { z } from "zod";

import { ApplicationStageSchema } from "@/lib/application/stages";
import { requireUserId } from "@/lib/auth/requireUser";
import { prisma } from "@/lib/db/prisma";

const JobNoteUpdateSchema = z.object({
  content: z.string().trim().min(1, "Note content is required."),
  stage: ApplicationStageSchema,
});

function parseId(value: string): number | null {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

type JobNoteRouteContext = {
  params: Promise<{ id: string; noteId: string }>;
};

export async function PUT(request: Request, { params }: JobNoteRouteContext) {
  const auth = await requireUserId(request);
  if (!auth.ok) return auth.response;

  const resolved = await params;
  const jobId = parseId(resolved.id);
  const noteId = parseId(resolved.noteId);

  if (!jobId || !noteId) {
    return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  }

  try {
    const body = (await request.json()) as unknown;
    const parsed = JobNoteUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid note payload." },
        { status: 400 },
      );
    }

    const job = await prisma.job.findFirst({
      where: { id: jobId, userId: auth.userId },
      select: { id: true },
    });
    if (!job) {
      return NextResponse.json({ error: "Job not found." }, { status: 404 });
    }

    const updated = await prisma.jobNote.updateMany({
      where: { id: noteId, jobId },
      data: {
        content: parsed.data.content,
        stage: parsed.data.stage,
      },
    });

    if (!updated.count) {
      return NextResponse.json({ error: "Note not found." }, { status: 404 });
    }

    const note = await prisma.jobNote.findUnique({
      where: { id: noteId },
      select: { id: true, createdAt: true, updatedAt: true, stage: true, content: true },
    });

    return NextResponse.json({ note }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Failed to update note." }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: JobNoteRouteContext) {
  const auth = await requireUserId(request);
  if (!auth.ok) return auth.response;

  const resolved = await params;
  const jobId = parseId(resolved.id);
  const noteId = parseId(resolved.noteId);

  if (!jobId || !noteId) {
    return NextResponse.json({ error: "Invalid id." }, { status: 400 });
  }

  const job = await prisma.job.findFirst({
    where: { id: jobId, userId: auth.userId },
    select: { id: true },
  });
  if (!job) {
    return NextResponse.json({ error: "Job not found." }, { status: 404 });
  }

  const deleted = await prisma.jobNote.deleteMany({ where: { id: noteId, jobId } });
  if (!deleted.count) {
    return NextResponse.json({ error: "Note not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
