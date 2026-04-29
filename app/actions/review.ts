"use server";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createReview } from "@/lib/services/review-service";
import type { ActionResult } from "@/lib/actions";

export async function createReviewAction(_prev: unknown, fd: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const data: Record<string, unknown> = {};
  for (const [k, v] of fd.entries()) if (typeof v === "string") data[k] = v;
  const r = await createReview(data, user);
  if (r.ok && typeof data.bookingId === "string") {
    revalidatePath(`/dashboard/bookings/${data.bookingId}`);
  }
  return r;
}
