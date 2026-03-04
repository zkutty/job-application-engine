import { NextResponse } from "next/server";

import { enhanceResumeText } from "@/lib/profile/enhanceResume";
import { parseProfileFromResumeText } from "@/lib/profile/importResume";
import { ResumeEnhancementRequestSchema } from "@/lib/validation/profile";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as unknown;
    const parsed = ResumeEnhancementRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid resume enhancement request." },
        { status: 400 },
      );
    }

    const enhanced = await enhanceResumeText(parsed.data);
    const rewrittenProfile = await parseProfileFromResumeText(enhanced.rewrittenResume);

    return NextResponse.json(
      {
        topFeedback: enhanced.topFeedback,
        rewritePlan: enhanced.rewritePlan,
        rewrittenResume: enhanced.rewrittenResume,
        parsedProfile: rewrittenProfile,
      },
      { status: 200 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to enhance resume.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
