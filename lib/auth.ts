import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { prisma } from "./db";
import { SESSION_COOKIE_NAME, SESSION_TTL_DAYS } from "./constants";
import type { User, UserRole } from "@prisma/client";

const ALG = "HS256";

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET environment variable is not set");
  }
  return new TextEncoder().encode(secret);
}

export type SessionPayload = {
  uid: string;
  role: UserRole;
  status: User["status"];
  tokenVersion: number;
};

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signSession(payload: SessionPayload): Promise<string> {
  const exp = `${SESSION_TTL_DAYS}d`;
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime(exp)
    .sign(getSecret());
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (
      payload &&
      typeof payload === "object" &&
      typeof (payload as { uid?: unknown }).uid === "string" &&
      typeof (payload as { role?: unknown }).role === "string" &&
      typeof (payload as { status?: unknown }).status === "string" &&
      typeof (payload as { tokenVersion?: unknown }).tokenVersion === "number"
    ) {
      return {
        uid: payload.uid as string,
        role: payload.role as UserRole,
        status: payload.status as User["status"],
        tokenVersion: payload.tokenVersion as number,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export async function createSessionCookie(user: {
  id: string;
  role: UserRole;
  status: User["status"];
  tokenVersion: number;
}): Promise<void> {
  const token = await signSession({
    uid: user.id,
    role: user.role,
    status: user.status,
    tokenVersion: user.tokenVersion,
  });
  cookies().set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_DAYS * 24 * 60 * 60,
  });
}

export async function destroySessionCookie(): Promise<void> {
  cookies().delete(SESSION_COOKIE_NAME);
}

export type SessionUser = Pick<
  User,
  | "id"
  | "name"
  | "phone"
  | "email"
  | "role"
  | "status"
  | "tokenVersion"
  | "trustScore"
  | "averageRating"
  | "totalReviews"
>;

export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  const session = await verifySession(token);
  if (!session) return null;
  if (session.status === "BANNED" || session.status === "SUSPENDED") return null;
  const user = await prisma.user.findUnique({
    where: { id: session.uid },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      role: true,
      status: true,
      tokenVersion: true,
      trustScore: true,
      averageRating: true,
      totalReviews: true,
    },
  });
  if (!user) return null;
  if (user.tokenVersion !== session.tokenVersion) return null;
  if (user.status === "BANNED") return null;
  return user;
});

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.status === "SUSPENDED") redirect("/login?error=suspended");
  return user;
}

export async function requireProvider(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "PROVIDER" && user.role !== "ADMIN") {
    redirect("/dashboard?error=provider_required");
  }
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/dashboard?error=admin_required");
  return user;
}
