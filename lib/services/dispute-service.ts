import "server-only";
import { prisma } from "../db";
import { disputeSchema, disputeResolveSchema } from "../validators/dispute";
import { fail, flattenZodError, ok, type ActionResult } from "../actions";
import { createNotification } from "./notification-service";

type CurrentUser = { id: string; role: "CUSTOMER" | "PROVIDER" | "ADMIN" };

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
  const dispute = await prisma.dispute.create({
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
  await prisma.booking.update({
    where: { id: booking.id },
    data: { status: "DISPUTED" },
  });
  await prisma.bookingStatusHistory.create({
    data: {
      bookingId: booking.id,
      oldStatus: booking.status,
      newStatus: "DISPUTED",
      changedById: currentUser.id,
      note: "Dispute raised",
    },
  });
  const otherParty = currentUser.id === booking.renterId ? booking.ownerId : booking.renterId;
  await createNotification(
    otherParty,
    "DISPUTE",
    "Dispute raised",
    parsed.data.title,
    booking.id
  );
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
  const dispute = await prisma.dispute.update({
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
  await createNotification(
    dispute.booking.renterId,
    "DISPUTE",
    "Dispute resolved",
    parsed.data.decision,
    dispute.bookingId
  );
  await createNotification(
    dispute.booking.ownerId,
    "DISPUTE",
    "Dispute resolved",
    parsed.data.decision,
    dispute.bookingId
  );
  return ok();
}

export async function rejectDispute(
  disputeId: string,
  reason: string,
  adminUser: CurrentUser
): Promise<ActionResult> {
  if (adminUser.role !== "ADMIN") return fail("Admin only.");
  await prisma.dispute.update({
    where: { id: disputeId },
    data: { status: "REJECTED", adminDecision: reason, resolvedAt: new Date() },
  });
  return ok();
}
