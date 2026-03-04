import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE_NAME = "jae_session";

function unauthorized() {
  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Secure Area"' },
  });
}

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isAuthPage = path === "/login";
  const isPublicAuthApi = path === "/api/auth/login" || path === "/api/auth/register";
  const hasSession = Boolean(req.cookies.get(SESSION_COOKIE_NAME)?.value);

  const user = process.env.BASIC_AUTH_USER;
  const pass = process.env.BASIC_AUTH_PASS;
  const isProduction = process.env.NODE_ENV === "production";

  if (!user || !pass) {
    if (isProduction) {
      return new NextResponse("Basic auth is not configured.", { status: 503 });
    }
  } else {
    const auth = req.headers.get("authorization");
    if (!auth || !auth.startsWith("Basic ")) return unauthorized();

    const base64 = auth.split(" ")[1] ?? "";

    let providedUser = "";
    let providedPass = "";

    try {
      const decoded = atob(base64);
      const separatorIndex = decoded.indexOf(":");

      if (separatorIndex === -1) return unauthorized();

      providedUser = decoded.slice(0, separatorIndex);
      providedPass = decoded.slice(separatorIndex + 1);
    } catch {
      return unauthorized();
    }

    if (providedUser !== user || providedPass !== pass) return unauthorized();
  }

  if (!hasSession && !isAuthPage && !isPublicAuthApi) {
    if (path.startsWith("/api/")) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  if (hasSession && isAuthPage) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
