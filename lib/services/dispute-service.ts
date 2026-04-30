import "server-only";
import { prisma } from "../db";
import { disputeSchema, disputeResolveSchema } from "../validators/dispute";
import { fail, flattenZodError, ok, type ActionResult } from "../actions";
import { createNotification } from "./notification-service";
import type { BookingStatus } from "@prisma/client";

type CurrentUser = { id: string; role: "CUSTOMER" | "PROVIDER" | "ADMIN" };
const DISPUTE_ALLOWED_STATUSES: BookingStatus[] = [
  "ACCEPTED",
  "PAYMENT_PENDING",
  "CONFIRMED",
  "PICKUP_SCHEDULED",
  "IN_USE",
  "RETURN_DUE",
  "RETURN_REQUESTED",
  "RETURN_CONFIRMED",
  "PROVIDER_ON_WAY",
  "STARTED",
  "COMPLETED_BY_PROVIDER",
  "CONFIRMED_BY_CUSTOMER",
];

export async function createDispute(
  raw: unknown,
  currentUser: CurrentUser
): Promise<ActionResult<{ id: string }>> {
  const parsed = disputeSchema.safeParse(raw);
  if (!parsed.success) return fail("Please correct errors.", flattenZodError(parsed.error));
  const booking = await prisma.booking.findUnique({ where: { id: parsed.data.bookingId } });
  if (!booking) return fail("Booking not found.");
  if (booking.renterId !== currentUser.id && booking.ownerId !== currentUser.id) {
    return fail("Only booking parties can raise a dispute.");
  }
  if (!DISPUTE_ALLOWED_STATUSES.includes(booking.status)) {
    return fail("A dispute cannot be opened for this booking state.");
  }
  let dispute: { id: string };
  try {
    dispute = await prisma.$transaction(async (tx) => {
      const created = await tx.dispute.create({
        data: {
          bookingId: booking.id,
          raisedById: currentUser.id,
          type: parsed.data.type,
          title: parsed.data.title,
          description: parsed.data.description,
          claimedAmount: parsed.data.claimedAmount ?? null,
          evidence: {
            createMany: {
              data: parsed.data.evidenceUrls.map((url) => ({ url })),
            },
          },
        },
      });
      const updated = await tx.booking.updateMany({
        where: { id: booking.id, status: { in: DISPUTE_ALLOWED_STATUSES } },
        data: { status: "DISPUTED" },
      });
      if (updated.count !== 1) {
        throw new Error("DISPUTE_STATUS_CHANGED");
      }
      await tx.bookingStatusHistory.create({
        data: {
          bookingId: booking.id,
          oldStatus: booking.status,
          newStatus: "DISPUTED",
          changedById: currentUser.id,
          note: "Dispute raised",
        },
      });
      return created;
    });
  } catch (error) {
    if (error instanceof Error && error.message === "DISPUTE_STATUS_CHANGED") {
      return fail("Booking status changed while opening the dispute. Please refresh and try again.");
    }
    throw error;
  }
  const otherParty = currentUser.id === booking.renterId ? booking.ownerId : booking.renterId;
  await Promise.allSettled([createNotification(
    otherParty,
    "DISPUTE",
    "Dispute raised",
    parsed.data.title,
    booking.id
  )]);
  return ok({ id: dispute.id }, "Dispute submitted.");
}

export async function addDisputeEvidence(
  disputeId: string,
  url: string,
  text: string | undefined,
  currentUser: CurrentUser
): Promise<ActionResult> {
  const dispute = await prisma.dispute.findUnique({ where: { id: disputeId } });
  if (!dispute) return fail("Dispute not found.");
  const booking = await prisma.booking.findUnique({ where: { id: dispute.bookingId } });
  if (!booking) return fail("Booking not found.");
  const allowed =
    currentUser.role === "ADMIN" ||
    booking.renterId === currentUser.id ||
    booking.ownerId === currentUser.id;
  if (!allowed) return fail("Not authorized.");
  await prisma.disputeEvidence.create({
    data: { disputeId, url: url || null, text: text || null },
  });
  return ok();
}

export async function resolveDispute(raw: unknown, adminUser: CurrentUser): Promise<ActionResult> {
  if (adminUser.role !== "ADMIN") return fail("Admin only.");
  const parsed = disputeResolveSchema.safeParse(raw);
  if (!parsed.success) return fail("Invalid input.", flattenZodError(parsed.error));
  const existing = await prisma.dispute.findUnique({
    where: { id: parsed.data.disputeId },
    include: { booking: true },
  });
  if (!existing) return fail("Dispute not found.");
  if (existing.status !== "OPEN" && existing.status !== "IN_REVIEW") {
    return fail("Only open disputes can be resolved.");
  }
  const dispute = await prisma.$transaction(async (tx) => {
    const updated = await tx.dispute.update({
      where: { id: parsed.data.disputeId },
      data: {
        status: "RESOLVED",
        adminDecision: parsed.data.decision,
        refundAmount: parsed.data.refundAmount ?? null,
        deductionAmount: parsed.data.deductionAmount ?? null,
        resolvedAt: new Date(),
      },
      include: { booking: true },
    });
    await tx.auditLog.create({
      data: {
        userId: adminUser.id,
        action: "dispute.resolve",
        entityType: "Dispute",
        entityId: parsed.data.disputeId,
      },
    });
    return updated;
  });
  await Promise.allSettled([createNotification(
    dispute.booking.renterId,
    "DISPUTE",
    "Dispute resolved",
    parsed.data.decision,
    dispute.bookingId
  ), createNotification(
    dispute.booking.ownerId,
    "DISPUTE",
    "Dispute resolved",
    parsed.data.decision,
    dispute.bookingId
  )]);
  return ok();
}

export async function rejectDispute(
  disputeId: string,
  reason: string,
  adminUser: CurrentUser
): Promise<ActionResult> {
  if (adminUser.role !== "ADMIN") return fail("Admin only.");
  const existing = await prisma.dispute.findUnique({ where: { id: disputeId } });
  if (!existing) return fail("Dispute not found.");
  if (existing.status !== "OPEN" && existing.status !== "IN_REVIEW") {
    return fail("Only open disputes can be rejected.");
  }
  await prisma.$transaction([
    prisma.dispute.update({
      where: { id: disputeId },
      data: { status: "REJECTED", adminDecision: reason, resolvedAt: new Date() },
    }),
    prisma.auditLog.create({
      data: {
        userId: adminUser.id,
        action: "dispute.reject",
        entityType: "Dispute",
        entityId: disputeId,
        metadata: { reason },
      },
    }),
  ]);
  return ok();
}
