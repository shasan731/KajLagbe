"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireProvider, requireAdmin } from "@/lib/auth";
import {
  approveListing,
  archiveListing,
  createListing,
  rejectListing,
  submitListingForReview,
  suspendListing,
  updateListing,
} from "@/lib/services/listing-service";
import type { ActionResult } from "@/lib/actions";

function parseFormToInput(fd: FormData): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  for (const [k, v] of fd.entries()) {
    if (k === "imageUrls") continue;
    if (typeof v === "string") obj[k] = v;
  }
  obj["imageUrls"] = (fd.getAll("imageUrls") || []).map(String).filter(Boolean);
  obj["deliveryAvailable"] = fd.get("deliveryAvailable") === "on";
  return obj;
}

export async function createListingAction(_prev: unknown, fd: FormData): Promise<ActionResult> {
  const user = await requireProvider();
  const r = await createListing(parseFormToInput(fd), user);
  if (r.ok) {
    revalidatePath("/provider/listings");
    redirect(`/provider/listings/${r.data!.id}/edit?created=1`);
  }
  return r;
}

export async function updateListingAction(
  listingId: string,
  _prev: unknown,
  fd: FormData
): Promise<ActionResult> {
  const user = await requireProvider();
  const r = await updateListing(listingId, parseFormToInput(fd), user);
  if (r.ok) {
    revalidatePath("/provider/listings");
    revalidatePath(`/provider/listings/${listingId}/edit`);
  }
  return r;
}

export async function submitListingAction(listingId: string) {
  const user = await requireProvider();
  const r = await submitListingForReview(listingId, user);
  revalidatePath("/provider/listings");
  return r;
}

export async function approveListingAction(listingId: string) {
  const admin = await requireAdmin();
  const r = await approveListing(listingId, admin);
  revalidatePath("/admin/listings");
  return r;
}

export async function rejectListingAction(listingId: string, reason: string) {
  const admin = await requireAdmin();
  const r = await rejectListing(listingId, reason, admin);
  revalidatePath("/admin/listings");
  return r;
}

export async function suspendListingAction(listingId: string, reason: string) {
  const admin = await requireAdmin();
  const r = await suspendListing(listingId, reason, admin);
  revalidatePath("/admin/listings");
  return r;
}

export async function archiveListingAction(listingId: string) {
  const user = await requireProvider();
  const r = await archiveListing(listingId, user);
  revalidatePath("/provider/listings");
  return r;
}
