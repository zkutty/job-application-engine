import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { ApplicationStageSchema } from "@/lib/application/stages";
import { requireUserId } from "@/lib/auth/requireUser";
import { prisma } from "@/lib/db/prisma";

const JobRenameSchema = z.object({
  company: z.string().trim().min(1).max(120).optional(),
  title: z.string().trim().min(1).max(120).optional(),
  applicationStage: ApplicationStageSchema.optional(),
})
  .refine(
    (data) => Boolean(data.company?.trim() || data.title?.trim() || data.applicationStage),
    "Provide at least one field to update.",
  );

function parseId(params: { id: string }): number | null {
  const id = Number(params.id);
  return Number.isInteger(id) && id > 0 ? id : null;
}

type JobRouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: JobRouteContext) {
  const auth = await requireUserId(request);
  if (!auth.ok) return auth.response;

  const id = parseId(await params);
  if (!id) {
    return NextResponse.json({ error: "Invalid job id." }, { status: 400 });
  }

  try {
    const body = (await request.json()) as unknown;
    const parsed = JobRenameSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid rename payload." },
        { status: 400 },
      );
    }

    const updated = await prisma.job.updateMany({
      where: { id, userId: auth.userId },
      data: {
        ...(parsed.data.company ? { company: parsed.data.company } : {}),
        ...(parsed.data.title ? { title: parsed.data.title } : {}),
        ...(parsed.data.applicationStage ? { applicationStage: parsed.data.applicationStage } : {}),
      },
    });
    if (!updated.count) {
      return NextResponse.json({ error: "Job not found." }, { status: 404 });
    }

    const job = await prisma.job.findUnique({
      where: { id },
      select: { id: true, company: true, title: true, applicationStage: true },
    });
    if (!job) {
      return NextResponse.json({ error: "Job not found." }, { status: 404 });
    }

    return NextResponse.json({ job }, { status: 200 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Job not found." }, { status: 404 });
    }

    return NextResponse.json({ error: "Failed to rename job." }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: JobRouteContext) {
  const auth = await requireUserId(request);
  if (!auth.ok) return auth.response;

  const id = parseId(await params);
  if (!id) {
    return NextResponse.json({ error: "Invalid job id." }, { status: 400 });
  }

  try {
    const deleted = await prisma.job.deleteMany({
      where: { id, userId: auth.userId },
    });

    if (!deleted.count) {
      return NextResponse.json({ error: "Job not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return NextResponse.json({ error: "Job not found." }, { status: 404 });
    }

    return NextResponse.json({ error: "Failed to delete job." }, { status: 500 });
  }
}
