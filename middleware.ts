import { NextRequest, NextResponse } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isAuthPage = path === "/login";
  const isAuthCallback = path === "/api/auth/callback";

  const user_ba = process.env.BASIC_AUTH_USER;
  const pass_ba = process.env.BASIC_AUTH_PASS;
  const isProduction = process.env.NODE_ENV === "production";

  if (!user_ba || !pass_ba) {
    if (isProduction) {
      return new NextResponse("Basic auth is not configured.", { status: 503 });
    }
  } else {
    const auth = req.headers.get("authorization");
    if (!auth || !auth.startsWith("Basic ")) {
      return new NextResponse("Authentication required", {
        status: 401,
        headers: { "WWW-Authenticate": 'Basic realm="Secure Area"' },
      });
    }

    const base64 = auth.split(" ")[1] ?? "";
    try {
      const decoded = atob(base64);
      const separatorIndex = decoded.indexOf(":");
      if (separatorIndex === -1) throw new Error();
      const providedUser = decoded.slice(0, separatorIndex);
      const providedPass = decoded.slice(separatorIndex + 1);
      if (providedUser !== user_ba || providedPass !== pass_ba) throw new Error();
    } catch {
      return new NextResponse("Authentication required", {
        status: 401,
        headers: { "WWW-Authenticate": 'Basic realm="Secure Area"' },
      });
    }
  }

  const { user, supabaseResponse } = await updateSession(req);

  if (!user && !isAuthPage && !isAuthCallback) {
    if (path.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 },
      );
    }
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  if (user && isAuthPage) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
