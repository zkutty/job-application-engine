import { NextResponse } from "next/server";

import { requireUserId } from "@/lib/auth/requireUser";
import { prisma } from "@/lib/db/prisma";

const MAX_QUERY_LENGTH = 120;

export async function GET(request: Request) {
  const auth = await requireUserId(request);
  if (!auth.ok) return auth.response;

  try {
    const url = new URL(request.url);
    const search = (url.searchParams.get("q") ?? "").trim().slice(0, MAX_QUERY_LENGTH);
    const includeArchived =
      (url.searchParams.get("includeArchived") ?? "").toLowerCase() === "true" ||
      url.searchParams.get("includeArchived") === "1";

    const jobs = await prisma.job.findMany({
      where: {
        userId: auth.userId,
        ...(includeArchived ? {} : { applicationStage: { not: "withdrawn" } }),
        ...(search
          ? {
              OR: [
                { company: { contains: search } },
                { title: { contains: search } },
                { jdText: { contains: search } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        createdAt: true,
        company: true,
        title: true,
        applicationStage: true,
        _count: {
          select: {
            artifacts: true,
            notes: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        jobs: jobs.map((job) => ({
          id: job.id,
          createdAt: job.createdAt,
          company: job.company ?? "Unknown Company",
          title: job.title ?? "Untitled Role",
          applicationStage: job.applicationStage,
          archived: job.applicationStage === "withdrawn",
          artifactCount: job._count.artifacts,
          noteCount: job._count.notes,
        })),
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("[/api/jobs] Prisma error:", err);
    return NextResponse.json({ error: "Failed to load jobs." }, { status: 500 });
  }
}
