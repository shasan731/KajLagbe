"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import {
  createCategory,
  setUserRole,
  setUserStatus,
  updateCategoryStatus,
} from "@/lib/services/admin-service";
import type { ActionResult } from "@/lib/actions";

function form(fd: FormData): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of fd.entries()) if (typeof v === "string") out[k] = v;
  return out;
}

export async function setUserStatusAction(_prev: unknown, fd: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  const r = await setUserStatus(form(fd), admin);
  revalidatePath("/admin/users");
  return r;
}

export async function setUserRoleAction(userId: string, role: "CUSTOMER" | "PROVIDER" | "ADMIN") {
  const admin = await requireAdmin();
  const r = await setUserRole(userId, role, admin);
  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${userId}`);
  return r;
}

export async function createCategoryAction(_prev: unknown, fd: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  const data = form(fd);
  data.isActive = fd.get("isActive") === "on";
  data.isRestricted = fd.get("isRestricted") === "on";
  data.isBanned = fd.get("isBanned") === "on";
  const r = await createCategory(data, admin);
  revalidatePath("/admin/categories");
  return r;
}

export async function updateCategoryStatusAction(categoryId: string, isActive: boolean) {
  const admin = await requireAdmin();
  const r = await updateCategoryStatus(categoryId, isActive, admin);
  revalidatePath("/admin/categories");
  return r;
}
