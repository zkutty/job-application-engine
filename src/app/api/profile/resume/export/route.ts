import { NextResponse } from "next/server";
import { z } from "zod";

import { buildResumeRtf } from "@/lib/profile/exportRtf";

const ResumeExportSchema = z.object({
  candidateName: z.string().trim().min(1).max(120),
  resumeText: z.string().trim().min(80),
});

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as unknown;
    const parsed = ResumeExportSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid resume export request." },
        { status: 400 },
      );
    }

    const rtf = buildResumeRtf(parsed.data);
    const safeName = parsed.data.candidateName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const fileName = `${safeName || "candidate"}-resume.rtf`;

    return new NextResponse(rtf, {
      status: 200,
      headers: {
        "Content-Type": "application/rtf; charset=utf-8",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to export resume.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
