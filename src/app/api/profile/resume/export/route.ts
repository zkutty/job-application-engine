import { NextResponse } from "next/server";
import { z } from "zod";

import { buildResumeDocxBuffer } from "@/lib/profile/exportDocx";

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

    const docxBuffer = await buildResumeDocxBuffer(parsed.data);
    const safeName = parsed.data.candidateName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const fileName = `${safeName || "candidate"}-resume.docx`;

    return new NextResponse(new Uint8Array(docxBuffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "X-Content-Type-Options": "nosniff",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to export resume.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
