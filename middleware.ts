import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { SESSION_COOKIE_NAME } from "@/lib/constants";

async function readSession(
  token: string | undefined
): Promise<{ uid: string; role: string; status: string; tokenVersion: number } | null> {
  if (!token) return null;
  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    if (
      payload &&
      typeof (payload as { uid?: unknown }).uid === "string" &&
      typeof (payload as { role?: unknown }).role === "string" &&
      typeof (payload as { status?: unknown }).status === "string" &&
      typeof (payload as { tokenVersion?: unknown }).tokenVersion === "number"
    ) {
      return {
        uid: payload.uid as string,
        role: payload.role as string,
        status: payload.status as string,
        tokenVersion: payload.tokenVersion as number,
      };
    }
  } catch {
    return null;
  }
  return null;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = await readSession(token);

  const isProtected =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/provider") ||
    pathname.startsWith("/admin");
  const isAuthPage = pathname === "/login" || pathname === "/register";

  if (isProtected && !session) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (isProtected && session?.status !== "ACTIVE") {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("error", session?.status === "SUSPENDED" ? "suspended" : "banned");
    const response = NextResponse.redirect(url);
    response.cookies.delete(SESSION_COOKIE_NAME);
    return response;
  }

  if (isAuthPage && session?.status === "ACTIVE") {
    const url = req.nextUrl.clone();
    url.pathname = session.role === "ADMIN" ? "/admin" : session.role === "PROVIDER" ? "/provider" : "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/admin") && session?.role !== "ADMIN") {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    url.searchParams.set("error", "admin_required");
    return NextResponse.redirect(url);
  }

  if (
    pathname.startsWith("/provider") &&
    session?.role !== "PROVIDER" &&
    session?.role !== "ADMIN"
  ) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    url.searchParams.set("error", "provider_required");
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/provider/:path*", "/admin/:path*", "/login", "/register"],
};
