import { NextResponse } from "next/server";

import { requireUserId } from "@/lib/auth/requireUser";
import { prisma } from "@/lib/db/prisma";
import { analyzeJd } from "@/lib/jd/analyze";
import { resolveJobDescriptionInput } from "@/lib/jd/resolveInput";

export async function POST(request: Request) {
  const auth = await requireUserId(request);
  if (!auth.ok) return auth.response;

  try {
    const body = (await request.json()) as unknown;
    const jdText =
      typeof body === "object" && body !== null && "jdText" in body
        ? (body as { jdText?: unknown }).jdText
        : undefined;
    const jobIdRaw =
      typeof body === "object" && body !== null && "jobId" in body
        ? Number((body as { jobId?: unknown }).jobId)
        : null;
    const jobId =
      typeof jobIdRaw === "number" && Number.isInteger(jobIdRaw) && jobIdRaw > 0 ? jobIdRaw : null;

    const resolvedJdText = await resolveJobDescriptionInput(String(jdText ?? ""));
    const analysis = await analyzeJd(resolvedJdText);

    if (jobId) {
      await prisma.job.updateMany({
        where: { id: jobId, userId: auth.userId },
        data: {
          jdSummary: resolvedJdText,
          jdText: resolvedJdText,
          jdInsightsJson: JSON.stringify(analysis),
        },
      });
    }

    return NextResponse.json({ analysis }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to analyze job description.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
