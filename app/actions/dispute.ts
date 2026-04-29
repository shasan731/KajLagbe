"use server";
import { revalidatePath } from "next/cache";
import { requireUser, requireAdmin } from "@/lib/auth";
import {
  createDispute,
  rejectDispute,
  resolveDispute,
} from "@/lib/services/dispute-service";
import type { ActionResult } from "@/lib/actions";

function form(fd: FormData): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of fd.entries()) {
    if (k === "evidenceUrls") continue;
    if (typeof v === "string") out[k] = v;
  }
  out.evidenceUrls = (fd.getAll("evidenceUrls") || []).map(String).filter(Boolean);
  return out;
}

export async function createDisputeAction(_prev: unknown, fd: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const data = form(fd);
  const r = await createDispute(data, user);
  if (r.ok && typeof data.bookingId === "string") {
    revalidatePath(`/dashboard/bookings/${data.bookingId}`);
  }
  return r;
}

export async function resolveDisputeAction(_prev: unknown, fd: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  const data: Record<string, unknown> = {};
  for (const [k, v] of fd.entries()) if (typeof v === "string") data[k] = v;
  const r = await resolveDispute(data, admin);
  if (r.ok && typeof data.disputeId === "string") {
    revalidatePath(`/admin/disputes/${data.disputeId}`);
    revalidatePath(`/admin/disputes`);
  }
  return r;
}

export async function rejectDisputeAction(disputeId: string, reason: string) {
  const admin = await requireAdmin();
  const r = await rejectDispute(disputeId, reason, admin);
  revalidatePath(`/admin/disputes/${disputeId}`);
  revalidatePath(`/admin/disputes`);
  return r;
}
