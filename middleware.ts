import { NextResponse, type NextRequest } from "next/server";

import { assertSameOrigin } from "@/lib/security/request";

const blockedPrefixes = [
  "/.env",
  "/.git",
  "/.vercel",
  "/node_modules",
  "/supabase",
  "/scripts",
  "/package.json",
  "/bun.lock",
  "/tsconfig.json",
  "/next.config",
];

const mutatingMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function isBlockedPath(pathname: string) {
  return blockedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isBlockedPath(pathname)) {
    return new NextResponse(null, { status: 404 });
  }

  const protocol =
    request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ??
    request.nextUrl.protocol.replace(":", "");

  if (process.env.NODE_ENV === "production" && protocol === "http") {
    const url = request.nextUrl.clone();
    url.protocol = "https:";
    return NextResponse.redirect(url, 308);
  }

  if (pathname.startsWith("/api/") && mutatingMethods.has(request.method)) {
    try {
      assertSameOrigin(request);
    } catch {
      return NextResponse.json(
        { error: "Origen no permitido.", code: "INVALID_ORIGIN" },
        { status: 403 },
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg).*)"],
};
