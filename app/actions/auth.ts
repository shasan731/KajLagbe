"use server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  createSessionCookie,
  destroySessionCookie,
  hashPassword,
  verifyPassword,
} from "@/lib/auth";
import { loginSchema, registerSchema } from "@/lib/validators/auth";
import { fail, flattenZodError, type ActionResult } from "@/lib/actions";
import { rateLimit } from "@/lib/rate-limit";

function fdToObject(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of formData.entries()) {
    if (typeof v === "string") out[k] = v;
  }
  return out;
}

export async function registerAction(
  _prev: unknown,
  formData: FormData
): Promise<ActionResult> {
  const parsed = registerSchema.safeParse(fdToObject(formData));
  if (!parsed.success) {
    return fail("Please correct the errors below.", flattenZodError(parsed.error));
  }
  const { phone, email, password, name, role, city, area } = parsed.data;

  const existing = await prisma.user.findFirst({
    where: { OR: [{ phone }, ...(email ? [{ email }] : [])] },
  });
  if (existing) {
    return fail("An account with that phone or email already exists.");
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      name,
      phone,
      email: email ?? null,
      passwordHash,
      role,
      profile: {
        create: { city: city ?? null, addressArea: area ?? null },
      },
    },
  });
  await createSessionCookie(user);
  const dest = role === "PROVIDER" ? "/provider" : "/dashboard";
  redirect(dest);
}

export async function loginAction(
  _prev: unknown,
  formData: FormData
): Promise<ActionResult> {
  const obj = fdToObject(formData);
  const parsed = loginSchema.safeParse(obj);
  if (!parsed.success) {
    return fail("Please check your phone and password.", flattenZodError(parsed.error));
  }
  const limit = rateLimit(`login:${parsed.data.phone}`, 8, 60_000);
  if (!limit.ok) {
    return fail("Too many attempts. Please wait a moment and try again.");
  }
  const user = await prisma.user.findUnique({ where: { phone: parsed.data.phone } });
  if (!user) return fail("Invalid phone number or password.");
  if (user.status === "BANNED") return fail("This account is banned.");
  const valid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!valid) return fail("Invalid phone number or password.");

  await createSessionCookie(user);
  const next = obj.next && obj.next.startsWith("/") ? obj.next : null;
  redirect(next ?? (user.role === "ADMIN" ? "/admin" : user.role === "PROVIDER" ? "/provider" : "/dashboard"));
}

export async function logoutAction(): Promise<void> {
  await destroySessionCookie();
  redirect("/");
}
