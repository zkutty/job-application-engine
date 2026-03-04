import { NextResponse } from "next/server";

import { getUserIdFromRequest } from "@/lib/auth/session";

export async function requireUserId(request: Request): Promise<
  | {
      ok: true;
      userId: number;
    }
  | {
      ok: false;
      response: NextResponse;
    }
> {
  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return { ok: false, response: NextResponse.json({ error: "Authentication required." }, { status: 401 }) };
  }

  return { ok: true, userId };
}
