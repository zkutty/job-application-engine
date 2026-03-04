import { NextResponse } from "next/server";
import { z } from "zod";

import { buildResumeHtml } from "@/lib/profile/exportHtml";

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

    const html = buildResumeHtml(parsed.data);
    const safeName = parsed.data.candidateName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const fileName = `${safeName || "candidate"}-resume.html`;

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to export resume.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
