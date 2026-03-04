import { NextResponse } from "next/server";

import { requireUserId } from "@/lib/auth/requireUser";
import { resolveJobDescriptionInput } from "@/lib/jd/resolveInput";

export async function POST(request: Request) {
  const auth = await requireUserId(request);
  if (!auth.ok) return auth.response;

  try {
    const body = (await request.json()) as unknown;
    const input =
      typeof body === "object" && body !== null && "input" in body
        ? String((body as { input?: unknown }).input ?? "")
        : "";

    const jobDescription = await resolveJobDescriptionInput(input);

    return NextResponse.json({ jobDescription }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to extract job description from URL.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
