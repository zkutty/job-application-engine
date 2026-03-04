import { NextResponse } from "next/server";
import { z } from "zod";

import { ApplicationStageSchema } from "@/lib/application/stages";
import { requireUserId } from "@/lib/auth/requireUser";
import { prisma } from "@/lib/db/prisma";

const JobNoteCreateSchema = z.object({
  content: z.string().trim().min(1, "Note content is required."),
  stage: ApplicationStageSchema.optional(),
});

function parseId(value: string): number | null {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

type JobNotesRouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, { params }: JobNotesRouteContext) {
  const auth = await requireUserId(request);
  if (!auth.ok) return auth.response;

  const jobId = parseId((await params).id);
  if (!jobId) {
    return NextResponse.json({ error: "Invalid job id." }, { status: 400 });
  }

  const job = await prisma.job.findFirst({
    where: { id: jobId, userId: auth.userId },
    select: { id: true },
  });
  if (!job) {
    return NextResponse.json({ error: "Job not found." }, { status: 404 });
  }

  const notes = await prisma.jobNote.findMany({
    where: { jobId },
    orderBy: { createdAt: "desc" },
    select: { id: true, createdAt: true, updatedAt: true, stage: true, content: true },
  });

  return NextResponse.json({ notes }, { status: 200 });
}

export async function POST(request: Request, { params }: JobNotesRouteContext) {
  const auth = await requireUserId(request);
  if (!auth.ok) return auth.response;

  const jobId = parseId((await params).id);
  if (!jobId) {
    return NextResponse.json({ error: "Invalid job id." }, { status: 400 });
  }

  try {
    const body = (await request.json()) as unknown;
    const parsed = JobNoteCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid note payload." },
        { status: 400 },
      );
    }

    const job = await prisma.job.findFirst({
      where: { id: jobId, userId: auth.userId },
      select: { id: true, applicationStage: true },
    });
    if (!job) {
      return NextResponse.json({ error: "Job not found." }, { status: 404 });
    }

    const note = await prisma.jobNote.create({
      data: {
        jobId,
        content: parsed.data.content,
        stage: parsed.data.stage ?? job.applicationStage,
      },
      select: { id: true, createdAt: true, updatedAt: true, stage: true, content: true },
    });

    return NextResponse.json({ note }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create note." }, { status: 500 });
  }
}
