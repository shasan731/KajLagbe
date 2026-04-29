"use server";
import { revalidatePath } from "next/cache";
import { requireUser, requireAdmin } from "@/lib/auth";
import {
  markPayoutReleased,
  markRefunded,
  rejectPayment,
  submitManualPayment,
  verifyPayment,
} from "@/lib/services/payment-service";
import type { ActionResult } from "@/lib/actions";

function form(fd: FormData): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of fd.entries()) {
    if (typeof v === "string") out[k] = v;
  }
  return out;
}

export async function submitPaymentAction(_prev: unknown, fd: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const data = form(fd);
  const r = await submitManualPayment(data, user);
  if (r.ok && typeof data.bookingId === "string") {
    revalidatePath(`/dashboard/bookings/${data.bookingId}`);
  }
  return r;
}

export async function verifyPaymentAction(paymentId: string) {
  const admin = await requireAdmin();
  const r = await verifyPayment(paymentId, admin);
  revalidatePath("/admin/payments");
  return r;
}

export async function rejectPaymentAction(paymentId: string, reason: string) {
  const admin = await requireAdmin();
  const r = await rejectPayment(paymentId, reason, admin);
  revalidatePath("/admin/payments");
  return r;
}

export async function refundPaymentAction(paymentId: string) {
  const admin = await requireAdmin();
  const r = await markRefunded(paymentId, admin);
  revalidatePath("/admin/payments");
  return r;
}

export async function payoutPaymentAction(paymentId: string) {
  const admin = await requireAdmin();
  const r = await markPayoutReleased(paymentId, admin);
  revalidatePath("/admin/payments");
  return r;
}
