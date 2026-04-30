import "server-only";
import { prisma } from "../db";
import {
  bookingSchema,
  cancelSchema,
  handoverSchema,
  quoteSchema,
} from "../validators/booking";
import { fail, flattenZodError, ok, type ActionResult } from "../actions";
import { calculatePlatformFee, calculateTotalAmount, toNumber } from "../money";
import { DEFAULT_COMMISSION_PERCENTAGE } from "../constants";
import { Prisma, type BookingStatus, type Listing } from "@prisma/client";
import { createNotification } from "./notification-service";
import { updateTrustScore } from "./review-service";

type CurrentUser = { id: string; role: "CUSTOMER" | "PROVIDER" | "ADMIN" };
type DbClient = typeof prisma | Prisma.TransactionClient;

const TOOL_RENTAL_CONFLICT_STATUSES: BookingStatus[] = [
  "REQUESTED",
  "QUOTE_SENT",
  "ACCEPTED",
  "PAYMENT_PENDING",
  "CONFIRMED",
  "PICKUP_SCHEDULED",
  "IN_USE",
  "RETURN_DUE",
  "RETURN_REQUESTED",
  "RETURN_CONFIRMED",
];

async function recordStatusChange(
  bookingId: string,
  oldStatus: BookingStatus | null,
  newStatus: BookingStatus,
  changedById?: string,
  note?: string,
  db: DbClient = prisma
) {
  await db.bookingStatusHistory.create({
    data: { bookingId, oldStatus, newStatus, changedById, note },
  });
}

function durationHours(start: Date, end: Date | null): number {
  if (!end) return 0;
  return Math.max(1, (end.getTime() - start.getTime()) / 36e5);
}

function durationDays(start: Date, end: Date | null): number {
  if (!end) return 1;
  return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 864e5));
}

function durationWeeks(start: Date, end: Date | null): number {
  return Math.max(1, Math.ceil(durationDays(start, end) / 7));
}

export function calculateBookingAmounts(listing: Listing, startAt: Date, endAt: Date | null) {
  let baseFee = 0;
  switch (listing.priceType) {
    case "HOURLY":
      baseFee = toNumber(listing.basePrice) * durationHours(startAt, endAt);
      break;
    case "DAILY":
      baseFee = toNumber(listing.basePrice) * durationDays(startAt, endAt);
      break;
    case "WEEKLY":
      baseFee = toNumber(listing.basePrice) * durationWeeks(startAt, endAt);
      break;
    case "TASK":
    case "PACKAGE":
      baseFee = toNumber(listing.basePrice);
      break;
    case "CUSTOM_QUOTE":
      baseFee = 0;
      break;
  }
  const commissionPct = toNumber(listing.commissionPercentage) || DEFAULT_COMMISSION_PERCENTAGE;
  const platformFee = calculatePlatformFee(baseFee, commissionPct);
  const depositAmount = toNumber(listing.depositAmount);
  const total = calculateTotalAmount({ baseFee, platformFee, depositAmount });
  return {
    baseFee,
    platformFee,
    depositAmount,
    commissionPct,
    totalAmount: total,
  };
}

export async function requestBooking(
  raw: unknown,
  currentUser: CurrentUser
): Promise<ActionResult<{ id: string }>> {
  const parsed = bookingSchema.safeParse(raw);
  if (!parsed.success) {
    return fail("Please correct the errors below.", flattenZodError(parsed.error));
  }
  const { listingId, startAt, endAt, jobDescription, renterNote } = parsed.data;
  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) return fail("Listing not found.");
  if (listing.status !== "ACTIVE") return fail("This listing is not currently bookable.");
  if (listing.ownerId === currentUser.id) return fail("You cannot book your own listing.");
  if (listing.listingType === "TOOL_ONLY" && !endAt) {
    return fail("Tool rentals require an end date.", { endAt: ["End date is required."] });
  }
  if (listing.listingType !== "TOOL_ONLY" && !jobDescription) {
    return fail("Job description is required for service bookings.", {
      jobDescription: ["Please describe the job."],
    });
  }

  const amounts = calculateBookingAmounts(listing, startAt, endAt ?? null);

  if (listing.listingType === "TOOL_ONLY" && endAt) {
    const conflicting = await prisma.booking.count({
      where: {
        listingId,
        status: { in: TOOL_RENTAL_CONFLICT_STATUSES },
        startAt: { lt: endAt },
        endAt: { gt: startAt },
      },
    });
    if (conflicting > 0) {
      return fail("This tool is already booked for the selected dates.", {
        startAt: ["Choose a different rental window."],
      });
    }
  }

  const booking = await prisma.booking.create({
    data: {
      listingId,
      renterId: currentUser.id,
      ownerId: listing.ownerId,
      startAt,
      endAt: endAt ?? null,
      jobDescription: jobDescription ?? null,
      renterNote: renterNote ?? null,
      baseFee: amounts.baseFee,
      depositAmount: amounts.depositAmount,
      platformFee: amounts.platformFee,
      commissionPercentage: amounts.commissionPct,
      totalAmount: amounts.totalAmount,
      status: "REQUESTED",
    },
  });
  await recordStatusChange(booking.id, null, "REQUESTED", currentUser.id);
  await createNotification(
    listing.ownerId,
    "BOOKING",
    "New booking request",
    `${listing.title} — booking #${booking.id.slice(-6)}`,
    booking.id
  );
  return ok({ id: booking.id }, "Booking requested.");
}

async function transition(
  bookingId: string,
  allowedFrom: BookingStatus[],
  newStatus: BookingStatus,
  currentUser: CurrentUser,
  opts?: {
    onlyOwner?: boolean;
    onlyRenter?: boolean;
    onlyAdmin?: boolean;
    note?: string;
    extraData?: Parameters<typeof prisma.booking.update>[0]["data"];
    notifyTo?: "owner" | "renter" | "both";
    notificationTitle?: string;
    notificationBody?: string;
  }
): Promise<ActionResult<{ id: string; status: BookingStatus }>> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { listing: { select: { title: true } } },
  });
  if (!booking) return fail("Booking not found.");
  if (opts?.onlyAdmin && currentUser.role !== "ADMIN") {
    return fail("Admin only.");
  }
  if (opts?.onlyOwner && booking.ownerId !== currentUser.id && currentUser.role !== "ADMIN") {
    return fail("Only the listing owner can perform this action.");
  }
  if (opts?.onlyRenter && booking.renterId !== currentUser.id && currentUser.role !== "ADMIN") {
    return fail("Only the renter can perform this action.");
  }
  if (
    !opts?.onlyOwner &&
    !opts?.onlyRenter &&
    !opts?.onlyAdmin &&
    booking.ownerId !== currentUser.id &&
    booking.renterId !== currentUser.id &&
    currentUser.role !== "ADMIN"
  ) {
    return fail("Not authorized for this booking.");
  }
  if (!allowedFrom.includes(booking.status)) {
    return fail(`Cannot move from ${booking.status} to ${newStatus}.`);
  }
  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.booking.updateMany({
      where: { id: bookingId, status: { in: allowedFrom } },
      data: { status: newStatus, ...(opts?.extraData ?? {}) },
    });
    if (result.count !== 1) return false;
    await recordStatusChange(bookingId, booking.status, newStatus, currentUser.id, opts?.note, tx);
    return true;
  });
  if (!updated) {
    return fail("Booking status changed while this action was running. Please refresh and try again.");
  }

  if (opts?.notifyTo && opts.notificationTitle && opts.notificationBody) {
    const targets: string[] = [];
    if (opts.notifyTo === "owner" || opts.notifyTo === "both") targets.push(booking.ownerId);
    if (opts.notifyTo === "renter" || opts.notifyTo === "both") targets.push(booking.renterId);
    await Promise.allSettled(
      targets
        .filter((id) => id !== currentUser.id)
        .map((id) =>
          createNotification(id, "BOOKING", opts.notificationTitle!, opts.notificationBody!, bookingId)
        )
    );
  }
  return ok({ id: bookingId, status: newStatus });
}

export async function acceptBooking(bookingId: string, currentUser: CurrentUser) {
  return transition(bookingId, ["REQUESTED"], "ACCEPTED", currentUser, {
    onlyOwner: true,
    notifyTo: "renter",
    notificationTitle: "Booking accepted",
    notificationBody: "Your booking request was accepted. Please proceed to payment.",
  });
}

export async function rejectBooking(bookingId: string, reason: string, currentUser: CurrentUser) {
  return transition(bookingId, ["REQUESTED", "QUOTE_SENT"], "CANCELLED", currentUser, {
    onlyOwner: true,
    note: reason,
    extraData: { cancellationReason: reason },
    notifyTo: "renter",
    notificationTitle: "Booking rejected",
    notificationBody: reason || "Your booking was rejected.",
  });
}

export async function sendQuote(raw: unknown, currentUser: CurrentUser): Promise<ActionResult> {
  const parsed = quoteSchema.safeParse(raw);
  if (!parsed.success) return fail("Invalid quote.", flattenZodError(parsed.error));
  const booking = await prisma.booking.findUnique({ where: { id: parsed.data.bookingId } });
  if (!booking) return fail("Booking not found.");
  if (booking.ownerId !== currentUser.id && currentUser.role !== "ADMIN") return fail("Not authorized.");
  if (!["REQUESTED", "QUOTE_SENT"].includes(booking.status)) {
    return fail(`Cannot send a quote while booking is ${booking.status}.`);
  }
  const baseFee = parsed.data.amount;
  const commissionPct = toNumber(booking.commissionPercentage) || DEFAULT_COMMISSION_PERCENTAGE;
  const platformFee = calculatePlatformFee(baseFee, commissionPct);
  const totalAmount = calculateTotalAmount({
    baseFee,
    platformFee,
    depositAmount: toNumber(booking.depositAmount),
  });
  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.booking.updateMany({
      where: { id: booking.id, status: { in: ["REQUESTED", "QUOTE_SENT"] } },
      data: {
        quotedAmount: baseFee,
        baseFee,
        platformFee,
        totalAmount,
        ownerNote: parsed.data.note ?? booking.ownerNote,
        status: "QUOTE_SENT",
      },
    });
    if (result.count !== 1) return false;
    await recordStatusChange(booking.id, booking.status, "QUOTE_SENT", currentUser.id, parsed.data.note, tx);
    return true;
  });
  if (!updated) return fail("Booking status changed while this quote was being sent.");
  await Promise.allSettled([createNotification(
    booking.renterId,
    "BOOKING",
    "Quote sent",
    `Provider sent a quote of ${baseFee} BDT.`,
    booking.id
  )]);
  return ok();
}

export async function confirmQuote(bookingId: string, currentUser: CurrentUser) {
  return transition(bookingId, ["QUOTE_SENT"], "ACCEPTED", currentUser, {
    onlyRenter: true,
    notifyTo: "owner",
    notificationTitle: "Quote accepted",
    notificationBody: "Customer accepted your quote.",
  });
}

export async function markPaymentPending(bookingId: string, currentUser: CurrentUser) {
  return transition(bookingId, ["ACCEPTED"], "PAYMENT_PENDING", currentUser, {
    notifyTo: "both",
    notificationTitle: "Payment pending",
    notificationBody: "Booking moved to payment-pending state.",
  });
}

export async function confirmBookingAfterPayment(bookingId: string, currentUser: CurrentUser) {
  return transition(bookingId, ["PAYMENT_PENDING"], "CONFIRMED", currentUser, {
    onlyAdmin: true,
    notifyTo: "both",
    notificationTitle: "Booking confirmed",
    notificationBody: "Payment verified. Booking is confirmed.",
  });
}

export async function markPickupScheduled(bookingId: string, currentUser: CurrentUser) {
  return transition(bookingId, ["CONFIRMED"], "PICKUP_SCHEDULED", currentUser, {
    onlyOwner: true,
    notifyTo: "renter",
    notificationTitle: "Pickup scheduled",
    notificationBody: "Provider has scheduled your pickup.",
  });
}

async function ensureHandover(
  db: DbClient,
  bookingId: string,
  type: "PICKUP" | "RETURN" | "SERVICE_START" | "SERVICE_END",
  conditionNote?: string,
  imageUrls: string[] = [],
  confirmedBy?: "RENTER" | "OWNER"
) {
  const now = new Date();
  const handover = await db.handoverRecord.upsert({
    where: { bookingId_type: { bookingId, type } },
    create: {
      bookingId,
      type,
      confirmedByRenter: confirmedBy === "RENTER",
      confirmedByOwner: confirmedBy === "OWNER",
      renterConfirmedAt: confirmedBy === "RENTER" ? now : null,
      ownerConfirmedAt: confirmedBy === "OWNER" ? now : null,
      conditionNote: conditionNote ?? null,
    },
    update: {
      confirmedByRenter: confirmedBy === "RENTER" ? true : undefined,
      confirmedByOwner: confirmedBy === "OWNER" ? true : undefined,
      renterConfirmedAt: confirmedBy === "RENTER" ? now : undefined,
      ownerConfirmedAt: confirmedBy === "OWNER" ? now : undefined,
      conditionNote: conditionNote ?? undefined,
    },
  });
  if (imageUrls.length > 0) {
    await db.handoverMedia.createMany({
      data: imageUrls.map((url) => ({ handoverId: handover.id, url })),
    });
  }
  return handover;
}

export async function confirmPickup(raw: unknown, currentUser: CurrentUser): Promise<ActionResult> {
  const parsed = handoverSchema.safeParse(raw);
  if (!parsed.success) return fail("Invalid input.", flattenZodError(parsed.error));
  if (parsed.data.type !== "PICKUP") return fail("Wrong handover type.");
  const booking = await prisma.booking.findUnique({ where: { id: parsed.data.bookingId } });
  if (!booking) return fail("Booking not found.");
  const isRenter = booking.renterId === currentUser.id;
  const isOwner = booking.ownerId === currentUser.id;
  if (!isRenter && !isOwner && currentUser.role !== "ADMIN") return fail("Not authorized.");
  const result = await prisma.$transaction(async (tx) => {
    const handover = await ensureHandover(
      tx,
      booking.id,
      "PICKUP",
      parsed.data.conditionNote,
      parsed.data.imageUrls,
      isRenter ? "RENTER" : "OWNER"
    );
    if (handover.confirmedByOwner && handover.confirmedByRenter) {
      const updated = await tx.booking.updateMany({
        where: { id: booking.id, status: "PICKUP_SCHEDULED" },
        data: { status: "IN_USE" },
      });
      if (updated.count === 1) {
        await recordStatusChange(booking.id, "PICKUP_SCHEDULED", "IN_USE", currentUser.id, undefined, tx);
      }
      return updated.count === 1;
    }
    return false;
  });
  if (!result) {
    const current = await prisma.booking.findUnique({
      where: { id: booking.id },
      select: { status: true },
    });
    if (
      current?.status !== "PICKUP_SCHEDULED" &&
      current?.status !== "IN_USE" &&
      current?.status !== "RETURN_DUE" &&
      current?.status !== "RETURN_REQUESTED" &&
      current?.status !== "RETURN_CONFIRMED"
    ) {
      return fail("Pickup can only be completed after pickup is scheduled.");
    }
  }
  return ok(undefined, "Pickup confirmation recorded.");
}

export async function requestReturn(bookingId: string, currentUser: CurrentUser) {
  return transition(bookingId, ["IN_USE", "RETURN_DUE"], "RETURN_REQUESTED", currentUser, {
    onlyRenter: true,
    notifyTo: "owner",
    notificationTitle: "Return requested",
    notificationBody: "Customer is ready to return the tool.",
  });
}

export async function confirmReturn(raw: unknown, currentUser: CurrentUser): Promise<ActionResult> {
  const parsed = handoverSchema.safeParse(raw);
  if (!parsed.success) return fail("Invalid input.", flattenZodError(parsed.error));
  if (parsed.data.type !== "RETURN") return fail("Wrong handover type.");
  const booking = await prisma.booking.findUnique({ where: { id: parsed.data.bookingId } });
  if (!booking) return fail("Booking not found.");
  const isRenter = booking.renterId === currentUser.id;
  const isOwner = booking.ownerId === currentUser.id;
  if (!isRenter && !isOwner && currentUser.role !== "ADMIN") return fail("Not authorized.");
  const result = await prisma.$transaction(async (tx) => {
    const handover = await ensureHandover(
      tx,
      booking.id,
      "RETURN",
      parsed.data.conditionNote,
      parsed.data.imageUrls,
      isRenter ? "RENTER" : "OWNER"
    );
    if (handover.confirmedByOwner && handover.confirmedByRenter) {
      const updated = await tx.booking.updateMany({
        where: { id: booking.id, status: "RETURN_REQUESTED" },
        data: { status: "RETURN_CONFIRMED" },
      });
      if (updated.count === 1) {
        await recordStatusChange(
          booking.id,
          "RETURN_REQUESTED",
          "RETURN_CONFIRMED",
          currentUser.id,
          undefined,
          tx
        );
      }
      return updated.count === 1;
    }
    return false;
  });
  if (!result) {
    const current = await prisma.booking.findUnique({
      where: { id: booking.id },
      select: { status: true },
    });
    if (current?.status !== "RETURN_REQUESTED" && current?.status !== "RETURN_CONFIRMED") {
      return fail("Return can only be completed after return is requested.");
    }
  }
  return ok(undefined, "Return confirmation recorded.");
}

export async function markServiceStarted(bookingId: string, currentUser: CurrentUser) {
  return transition(bookingId, ["CONFIRMED", "PROVIDER_ON_WAY"], "STARTED", currentUser, {
    onlyOwner: true,
    notifyTo: "renter",
    notificationTitle: "Service started",
    notificationBody: "Your provider has started the service.",
  });
}

export async function markServiceCompletedByProvider(bookingId: string, currentUser: CurrentUser) {
  return transition(bookingId, ["STARTED"], "COMPLETED_BY_PROVIDER", currentUser, {
    onlyOwner: true,
    notifyTo: "renter",
    notificationTitle: "Service completed",
    notificationBody: "Provider marked the service complete. Please confirm.",
  });
}

export async function confirmServiceCompletedByCustomer(bookingId: string, currentUser: CurrentUser) {
  return transition(bookingId, ["COMPLETED_BY_PROVIDER"], "CONFIRMED_BY_CUSTOMER", currentUser, {
    onlyRenter: true,
    notifyTo: "owner",
    notificationTitle: "Service confirmed",
    notificationBody: "Customer confirmed the service is complete.",
  });
}

export async function completeBooking(bookingId: string, currentUser: CurrentUser) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { ownerId: true, renterId: true },
  });
  const result = await transition(
    bookingId,
    ["RETURN_CONFIRMED", "CONFIRMED_BY_CUSTOMER"],
    "COMPLETED",
    currentUser,
    {
      extraData: { completedAt: new Date() },
      notifyTo: "both",
      notificationTitle: "Booking completed",
      notificationBody: "Booking is now complete. Please leave a review.",
    }
  );
  if (result.ok && booking) {
    await Promise.allSettled([updateTrustScore(booking.ownerId), updateTrustScore(booking.renterId)]);
  }
  return result;
}

export async function cancelBooking(raw: unknown, currentUser: CurrentUser): Promise<ActionResult> {
  const parsed = cancelSchema.safeParse(raw);
  if (!parsed.success) return fail("Invalid input.", flattenZodError(parsed.error));
  const result = await transition(
    parsed.data.bookingId,
    [
      "REQUESTED",
      "QUOTE_SENT",
      "ACCEPTED",
      "PAYMENT_PENDING",
      "CONFIRMED",
      "PICKUP_SCHEDULED",
      "PROVIDER_ON_WAY",
    ],
    "CANCELLED",
    currentUser,
    {
      extraData: { cancellationReason: parsed.data.reason },
      note: parsed.data.reason,
      notifyTo: "both",
      notificationTitle: "Booking cancelled",
      notificationBody: parsed.data.reason,
    }
  );
  if (result.ok) {
    const booking = await prisma.booking.findUnique({
      where: { id: parsed.data.bookingId },
      select: { ownerId: true, renterId: true },
    });
    if (booking) {
      await Promise.allSettled([updateTrustScore(booking.ownerId), updateTrustScore(booking.renterId)]);
    }
  }
  return result;
}

export async function moveBookingToDisputed(bookingId: string, currentUser: CurrentUser) {
  return transition(
    bookingId,
    [
      "ACCEPTED",
      "CONFIRMED",
      "PICKUP_SCHEDULED",
      "IN_USE",
      "RETURN_DUE",
      "RETURN_REQUESTED",
      "RETURN_CONFIRMED",
      "STARTED",
      "COMPLETED_BY_PROVIDER",
      "CONFIRMED_BY_CUSTOMER",
    ],
    "DISPUTED",
    currentUser,
    {
      notifyTo: "both",
      notificationTitle: "Dispute opened",
      notificationBody: "A dispute was opened against this booking.",
    }
  );
}
