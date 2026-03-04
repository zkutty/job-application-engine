import { NextResponse } from "next/server";
import { z } from "zod";

import { parseProfileFromResumeText } from "@/lib/profile/importResume";

const ResumeParseSchema = z.object({
  rawResumeText: z.string().trim().min(40),
});

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as unknown;
    const parsed = ResumeParseSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid resume parse request." },
        { status: 400 },
      );
    }

    const parsedProfile = await parseProfileFromResumeText(parsed.data.rawResumeText);
    return NextResponse.json({ parsedProfile }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to parse resume text.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
