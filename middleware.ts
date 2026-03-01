import { NextRequest, NextResponse } from "next/server";

function unauthorized() {
  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Secure Area"' },
  });
}

export function middleware(req: NextRequest) {
  const user = process.env.BASIC_AUTH_USER;
  const pass = process.env.BASIC_AUTH_PASS;
  const isProduction = process.env.NODE_ENV === "production";

  if (!user || !pass) {
    if (isProduction) {
      return new NextResponse("Basic auth is not configured.", { status: 503 });
    }

    return NextResponse.next();
  }

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

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
