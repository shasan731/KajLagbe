"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function toggleFavoriteAction(
  listingId: string
): Promise<{ ok: boolean; favored: boolean }> {
  const user = await requireUser();
  const existing = await prisma.favorite.findUnique({
    where: { userId_listingId: { userId: user.id, listingId } },
  });
  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    revalidatePath("/dashboard/favorites");
    return { ok: true, favored: false };
  }
  await prisma.favorite.create({ data: { userId: user.id, listingId } });
  revalidatePath("/dashboard/favorites");
  return { ok: true, favored: true };
}
