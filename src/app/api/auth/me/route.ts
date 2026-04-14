import { NextResponse } from "next/server";

import { prisma } from "@/lib/db/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Authentication required." },
      { status: 401 },
    );
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, email: true, createdAt: true },
  });

  if (!dbUser) {
    return NextResponse.json(
      { error: "User account not found." },
      { status: 404 },
    );
  }

  return NextResponse.json({ user: dbUser }, { status: 200 });
}
