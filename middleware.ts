import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { SESSION_COOKIE_NAME } from "@/lib/constants";

async function readSession(token: string | undefined): Promise<{ uid: string; role: string } | null> {
  if (!token) return null;
  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    if (
      payload &&
      typeof (payload as { uid?: unknown }).uid === "string" &&
      typeof (payload as { role?: unknown }).role === "string"
    ) {
      return { uid: payload.uid as string, role: payload.role as string };
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

  if (isProtected && !session) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
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
  matcher: ["/dashboard/:path*", "/provider/:path*", "/admin/:path*"],
};
