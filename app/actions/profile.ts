"use server";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fail, ok, type ActionResult } from "@/lib/actions";
import { Prisma } from "@prisma/client";
import { z } from "zod";

const profileSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z
    .string()
    .trim()
    .email()
    .optional()
    .or(z.literal("").transform(() => undefined)),
  bio: z.string().trim().max(1000).optional().or(z.literal("").transform(() => undefined)),
  city: z.string().trim().optional().or(z.literal("").transform(() => undefined)),
  addressArea: z
    .string()
    .trim()
    .optional()
    .or(z.literal("").transform(() => undefined)),
  avatarUrl: z
    .string()
    .url()
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export async function updateProfileAction(_prev: unknown, fd: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const obj: Record<string, string> = {};
  for (const [k, v] of fd.entries()) if (typeof v === "string") obj[k] = v;
  const parsed = profileSchema.safeParse(obj);
  if (!parsed.success) return fail("Invalid profile data.");
  try {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { name: parsed.data.name, email: parsed.data.email ?? null },
      }),
      prisma.userProfile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          bio: parsed.data.bio ?? null,
          city: parsed.data.city ?? null,
          addressArea: parsed.data.addressArea ?? null,
          avatarUrl: parsed.data.avatarUrl ?? null,
        },
        update: {
          bio: parsed.data.bio ?? null,
          city: parsed.data.city ?? null,
          addressArea: parsed.data.addressArea ?? null,
          avatarUrl: parsed.data.avatarUrl ?? null,
        },
      }),
    ]);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return fail("That email is already registered to another account.");
    }
    throw error;
  }
  revalidatePath("/dashboard/profile");
  return ok(undefined, "Profile saved.");
}
