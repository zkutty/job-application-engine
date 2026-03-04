import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db/prisma";

const JobRenameSchema = z.object({
  company: z.string().trim().min(1).max(120),
  title: z.string().trim().min(1).max(120),
});

function parseId(params: { id: string }): number | null {
  const id = Number(params.id);
  return Number.isInteger(id) && id > 0 ? id : null;
}

type JobRouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: JobRouteContext) {
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

    const job = await prisma.job.update({
      where: { id },
      data: { company: parsed.data.company, title: parsed.data.title },
      select: { id: true, company: true, title: true },
    });

    return NextResponse.json({ job }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Failed to rename job." }, { status: 500 });
  }
}
