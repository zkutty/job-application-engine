import { NextResponse } from "next/server";

import { requireUserId } from "@/lib/auth/requireUser";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: Request) {
  const auth = await requireUserId(request);
  if (!auth.ok) return auth.response;

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
    select: { id: true, email: true, createdAt: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User account not found." }, { status: 404 });
  }

  return NextResponse.json({ user }, { status: 200 });
}
