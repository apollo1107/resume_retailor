import { NextResponse } from "next/server";
import { parseCookies } from "@/lib/auth/cookies";
import { ACTIVITY_COOKIE, isActivityTimestampFresh } from "@/lib/auth/activity-cookie";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth/session-token";

async function getSessionForProxy(request) {
  const raw = request.headers.get("cookie") || "";
  const cookies = parseCookies(raw);
  if (!isActivityTimestampFresh(cookies[ACTIVITY_COOKIE])) return null;
  const token = cookies[SESSION_COOKIE];
  if (!token) return null;
  return verifySessionToken(token);
}

function isPublicPage(pathname) {
  return pathname === "/sign-in" || pathname === "/sign-up";
}

function isPublicApi(pathname) {
  return (
    pathname === "/api/auth/sign-in" ||
    pathname === "/api/auth/sign-up" ||
    pathname === "/api/auth/sign-out" ||
    pathname === "/api/auth/me" ||
    pathname === "/api/auth/ping"
  );
}

function isAdminPath(pathname) {
  return pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
}

export async function proxy(request) {
  const { pathname, search } = request.nextUrl;
  const session = await getSessionForProxy(request);

  if (isPublicPage(pathname)) {
    if (session) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/api")) {
    if (isPublicApi(pathname)) {
      return NextResponse.next();
    }
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (isAdminPath(pathname) && session.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.next();
  }

  if (!session) {
    const u = new URL("/sign-in", request.url);
    u.searchParams.set("next", `${pathname}${search || ""}`);
    return NextResponse.redirect(u);
  }

  if (isAdminPath(pathname) && session.role !== "admin") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
