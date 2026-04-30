"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin, requireProvider, requireUser } from "@/lib/auth";
import {
  acceptBooking,
  cancelBooking,
  completeBooking,
  confirmBookingAfterPayment,
  confirmPickup,
  confirmQuote,
  confirmReturn,
  confirmServiceCompletedByCustomer,
  markPickupScheduled,
  markServiceCompletedByProvider,
  markServiceStarted,
  rejectBooking,
  requestBooking,
  requestReturn,
  sendQuote,
} from "@/lib/services/booking-service";
import { fail, type ActionResult } from "@/lib/actions";

function form(fd: FormData): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of fd.entries()) {
    if (typeof v === "string") out[k] = v;
  }
  return out;
}

export async function requestBookingAction(
  _prev: unknown,
  fd: FormData
): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const result = await requestBooking(form(fd), user);
  if (result.ok) {
    revalidatePath("/dashboard/bookings");
  }
  return result;
}

export async function acceptBookingAction(bookingId: string) {
  const user = await requireProvider();
  const r = await acceptBooking(bookingId, user);
  revalidatePath(`/dashboard/bookings/${bookingId}`);
  revalidatePath(`/provider/bookings/${bookingId}`);
  return r;
}

export async function rejectBookingAction(bookingId: string, reason: string) {
  const user = await requireProvider();
  const r = await rejectBooking(bookingId, reason, user);
  revalidatePath(`/dashboard/bookings/${bookingId}`);
  revalidatePath(`/provider/bookings/${bookingId}`);
  return r;
}

export async function sendQuoteAction(_prev: unknown, fd: FormData): Promise<ActionResult> {
  const user = await requireProvider();
  const data = form(fd);
  const r = await sendQuote(data, user);
  if (r.ok && typeof data.bookingId === "string") {
    revalidatePath(`/provider/bookings/${data.bookingId}`);
    revalidatePath(`/dashboard/bookings/${data.bookingId}`);
  }
  return r;
}

export async function confirmQuoteAction(bookingId: string) {
  const user = await requireUser();
  const r = await confirmQuote(bookingId, user);
  revalidatePath(`/dashboard/bookings/${bookingId}`);
  return r;
}

export async function confirmBookingAction(bookingId: string) {
  const user = await requireAdmin();
  const r = await confirmBookingAfterPayment(bookingId, user);
  revalidatePath(`/admin/bookings/${bookingId}`);
  return r;
}

export async function markPickupScheduledAction(bookingId: string) {
  const user = await requireProvider();
  return markPickupScheduled(bookingId, user);
}

export async function confirmPickupAction(_prev: unknown, fd: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const data = form(fd);
  const imageUrls = (fd.getAll("imageUrls") || []).map(String).filter(Boolean);
  const r = await confirmPickup({ ...data, imageUrls }, user);
  if (r.ok && typeof data.bookingId === "string") {
    revalidatePath(`/dashboard/bookings/${data.bookingId}`);
    revalidatePath(`/provider/bookings/${data.bookingId}`);
  }
  return r;
}

export async function requestReturnAction(bookingId: string) {
  const user = await requireUser();
  return requestReturn(bookingId, user);
}

export async function confirmReturnAction(_prev: unknown, fd: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const data = form(fd);
  const imageUrls = (fd.getAll("imageUrls") || []).map(String).filter(Boolean);
  return confirmReturn({ ...data, imageUrls }, user);
}

export async function markServiceStartedAction(bookingId: string) {
  const user = await requireProvider();
  return markServiceStarted(bookingId, user);
}

export async function markServiceCompletedAction(bookingId: string) {
  const user = await requireProvider();
  return markServiceCompletedByProvider(bookingId, user);
}

export async function confirmServiceAction(bookingId: string) {
  const user = await requireUser();
  return confirmServiceCompletedByCustomer(bookingId, user);
}

export async function completeBookingAction(bookingId: string) {
  const user = await requireUser();
  return completeBooking(bookingId, user);
}

export async function cancelBookingAction(_prev: unknown, fd: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const data = form(fd);
  return cancelBooking(data, user);
}

export async function notImplemented(): Promise<ActionResult> {
  return fail("Not implemented in MVP.");
}
