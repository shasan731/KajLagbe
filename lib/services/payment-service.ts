import "server-only";
import { prisma } from "../db";
import { paymentSubmitSchema } from "../validators/payment";
import { fail, flattenZodError, ok, type ActionResult } from "../actions";
import { createNotification } from "./notification-service";
import { toNumber } from "../money";
import type { PaymentType } from "@prisma/client";

type CurrentUser = { id: string; role: "CUSTOMER" | "PROVIDER" | "ADMIN" };
type Numericish = Parameters<typeof toNumber>[0];

function expectedAmountForType(
  booking: {
    totalAmount: Numericish;
    depositAmount: Numericish;
    deliveryFee: Numericish;
  },
  type: PaymentType
) {
  if (type === "DEPOSIT") return toNumber(booking.depositAmount);
  if (type === "DELIVERY_FEE") return toNumber(booking.deliveryFee);
  return toNumber(booking.totalAmount);
}

function amountMatches(expected: number, actual: number) {
  if (expected <= 0) return actual > 0;
  return Math.abs(expected - actual) <= 1;
}

export async function submitManualPayment(
  raw: unknown,
  currentUser: CurrentUser
): Promise<ActionResult<{ id: string }>> {
  const parsed = paymentSubmitSchema.safeParse(raw);
  if (!parsed.success) return fail("Please correct errors.", flattenZodError(parsed.error));
  const booking = await prisma.booking.findUnique({ where: { id: parsed.data.bookingId } });
  if (!booking) return fail("Booking not found.");
  if (booking.renterId !== currentUser.id && currentUser.role !== "ADMIN") {
    return fail("Only the renter can submit payment.");
  }
  if (booking.status !== "ACCEPTED" && booking.status !== "PAYMENT_PENDING") {
    return fail("Payment can only be submitted after the booking is accepted.");
  }
  const expectedAmount = expectedAmountForType(booking, parsed.data.type);
  if (!amountMatches(expectedAmount, parsed.data.amount)) {
    return fail(`Payment amount must match the current due amount (${expectedAmount} BDT).`, {
      amount: ["Enter the current due amount."],
    });
  }

  const payment = await prisma.$transaction(async (tx) => {
    await tx.payment.updateMany({
      where: { bookingId: booking.id, status: "SUBMITTED" },
      data: { status: "REJECTED", adminNote: "Superseded by a newer payment submission." },
    });
    const created = await tx.payment.create({
      data: {
        bookingId: booking.id,
        payerId: currentUser.id,
        amount: parsed.data.amount,
        method: parsed.data.method,
        type: parsed.data.type,
        status: "SUBMITTED",
        transactionId: parsed.data.transactionId ?? null,
        proofImageUrl: parsed.data.proofImageUrl ?? null,
        adminNote: parsed.data.note ?? null,
      },
    });
    if (booking.status === "ACCEPTED") {
      const updated = await tx.booking.updateMany({
        where: { id: booking.id, status: "ACCEPTED" },
        data: { status: "PAYMENT_PENDING" },
      });
      if (updated.count === 1) {
        await tx.bookingStatusHistory.create({
          data: {
            bookingId: booking.id,
            oldStatus: "ACCEPTED",
            newStatus: "PAYMENT_PENDING",
            changedById: currentUser.id,
            note: "Payment submitted",
          },
        });
      }
    }
    return created;
  });
  await Promise.allSettled([createNotification(
    booking.ownerId,
    "PAYMENT",
    "Payment submitted",
    `Customer submitted a payment of ${parsed.data.amount} BDT.`,
    booking.id
  )]);
  return ok({ id: payment.id }, "Payment submitted. Awaiting verification.");
}

export async function verifyPayment(paymentId: string, adminUser: CurrentUser): Promise<ActionResult> {
  if (adminUser.role !== "ADMIN") return fail("Admin only.");
  const payment = await prisma.payment.findUnique({ where: { id: paymentId }, include: { booking: true } });
  if (!payment) return fail("Payment not found.");
  if (payment.status !== "SUBMITTED") return fail("Only submitted payments can be verified.");
  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.payment.updateMany({
      where: { id: paymentId, status: "SUBMITTED" },
      data: { status: "VERIFIED" },
    });
    if (result.count !== 1) return false;
    if (payment.booking.status === "PAYMENT_PENDING") {
      const bookingUpdate = await tx.booking.updateMany({
        where: { id: payment.bookingId, status: "PAYMENT_PENDING" },
        data: { status: "CONFIRMED" },
      });
      if (bookingUpdate.count === 1) {
        await tx.bookingStatusHistory.create({
          data: {
            bookingId: payment.bookingId,
            oldStatus: "PAYMENT_PENDING",
            newStatus: "CONFIRMED",
            changedById: adminUser.id,
            note: "Payment verified by admin",
          },
        });
      }
    }
    await tx.auditLog.create({
      data: {
        userId: adminUser.id,
        action: "payment.verify",
        entityType: "Payment",
        entityId: paymentId,
      },
    });
    return true;
  });
  if (!updated) return fail("Payment status changed while this action was running.");
  await Promise.allSettled([createNotification(
    payment.booking.renterId,
    "PAYMENT",
    "Payment verified",
    "Your payment was verified by admin.",
    payment.bookingId
  ), createNotification(
    payment.booking.ownerId,
    "PAYMENT",
    "Payment verified",
    "Customer payment was verified.",
    payment.bookingId
  )]);
  return ok();
}

export async function rejectPayment(
  paymentId: string,
  reason: string,
  adminUser: CurrentUser
): Promise<ActionResult> {
  if (adminUser.role !== "ADMIN") return fail("Admin only.");
  const payment = await prisma.payment.findUnique({ where: { id: paymentId }, include: { booking: true } });
  if (!payment) return fail("Payment not found.");
  if (payment.status !== "SUBMITTED") return fail("Only submitted payments can be rejected.");
  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.payment.updateMany({
      where: { id: paymentId, status: "SUBMITTED" },
      data: { status: "REJECTED", adminNote: reason },
    });
    if (result.count !== 1) return false;
    await tx.auditLog.create({
      data: {
        userId: adminUser.id,
        action: "payment.reject",
        entityType: "Payment",
        entityId: paymentId,
        metadata: { reason },
      },
    });
    return true;
  });
  if (!updated) return fail("Payment status changed while this action was running.");
  await Promise.allSettled([createNotification(
    payment.booking.renterId,
    "PAYMENT",
    "Payment rejected",
    reason,
    payment.bookingId
  )]);
  return ok();
}

export async function markRefunded(paymentId: string, adminUser: CurrentUser): Promise<ActionResult> {
  if (adminUser.role !== "ADMIN") return fail("Admin only.");
  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.payment.updateMany({
      where: { id: paymentId, status: "VERIFIED" },
      data: { status: "REFUNDED" },
    });
    if (result.count !== 1) return false;
    await tx.auditLog.create({
      data: {
        userId: adminUser.id,
        action: "payment.refund",
        entityType: "Payment",
        entityId: paymentId,
      },
    });
    return true;
  });
  if (!updated) return fail("Only verified payments can be marked refunded.");
  return ok();
}

export async function markPayoutReleased(
  paymentId: string,
  adminUser: CurrentUser
): Promise<ActionResult> {
  if (adminUser.role !== "ADMIN") return fail("Admin only.");
  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.payment.updateMany({
      where: { id: paymentId, status: "VERIFIED" },
      data: { status: "RELEASED" },
    });
    if (result.count !== 1) return false;
    await tx.auditLog.create({
      data: {
        userId: adminUser.id,
        action: "payment.payout_release",
        entityType: "Payment",
        entityId: paymentId,
      },
    });
    return true;
  });
  if (!updated) return fail("Only verified payments can be released.");
  return ok();
}
