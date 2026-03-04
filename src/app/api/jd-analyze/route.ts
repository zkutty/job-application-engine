import { NextResponse } from "next/server";

import { analyzeJd } from "@/lib/jd/analyze";
import { resolveJobDescriptionInput } from "@/lib/jd/resolveInput";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as unknown;
    const jdText =
      typeof body === "object" && body !== null && "jdText" in body
        ? (body as { jdText?: unknown }).jdText
        : undefined;

    const resolvedJdText = await resolveJobDescriptionInput(String(jdText ?? ""));
    const analysis = await analyzeJd(resolvedJdText);

    return NextResponse.json({ analysis }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to analyze job description.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
