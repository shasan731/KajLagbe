import "server-only";
import { prisma } from "../db";
import { paymentSubmitSchema } from "../validators/payment";
import { fail, flattenZodError, ok, type ActionResult } from "../actions";
import { createNotification } from "./notification-service";

type CurrentUser = { id: string; role: "CUSTOMER" | "PROVIDER" | "ADMIN" };

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
  const payment = await prisma.payment.create({
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
  // Move booking forward if currently accepted
  if (booking.status === "ACCEPTED") {
    await prisma.booking.update({ where: { id: booking.id }, data: { status: "PAYMENT_PENDING" } });
    await prisma.bookingStatusHistory.create({
      data: {
        bookingId: booking.id,
        oldStatus: "ACCEPTED",
        newStatus: "PAYMENT_PENDING",
        changedById: currentUser.id,
        note: "Payment submitted",
      },
    });
  }
  await createNotification(
    booking.ownerId,
    "PAYMENT",
    "Payment submitted",
    `Customer submitted a payment of ${parsed.data.amount} BDT.`,
    booking.id
  );
  return ok({ id: payment.id }, "Payment submitted. Awaiting verification.");
}

export async function verifyPayment(paymentId: string, adminUser: CurrentUser): Promise<ActionResult> {
  if (adminUser.role !== "ADMIN") return fail("Admin only.");
  const payment = await prisma.payment.update({
    where: { id: paymentId },
    data: { status: "VERIFIED" },
    include: { booking: true },
  });
  if (payment.booking.status === "PAYMENT_PENDING") {
    await prisma.booking.update({
      where: { id: payment.bookingId },
      data: { status: "CONFIRMED" },
    });
    await prisma.bookingStatusHistory.create({
      data: {
        bookingId: payment.bookingId,
        oldStatus: "PAYMENT_PENDING",
        newStatus: "CONFIRMED",
        changedById: adminUser.id,
        note: "Payment verified by admin",
      },
    });
  }
  await createNotification(
    payment.booking.renterId,
    "PAYMENT",
    "Payment verified",
    "Your payment was verified by admin.",
    payment.bookingId
  );
  await createNotification(
    payment.booking.ownerId,
    "PAYMENT",
    "Payment verified",
    "Customer payment was verified.",
    payment.bookingId
  );
  return ok();
}

export async function rejectPayment(
  paymentId: string,
  reason: string,
  adminUser: CurrentUser
): Promise<ActionResult> {
  if (adminUser.role !== "ADMIN") return fail("Admin only.");
  const payment = await prisma.payment.update({
    where: { id: paymentId },
    data: { status: "REJECTED", adminNote: reason },
    include: { booking: true },
  });
  await createNotification(
    payment.booking.renterId,
    "PAYMENT",
    "Payment rejected",
    reason,
    payment.bookingId
  );
  return ok();
}

export async function markRefunded(paymentId: string, adminUser: CurrentUser): Promise<ActionResult> {
  if (adminUser.role !== "ADMIN") return fail("Admin only.");
  await prisma.payment.update({
    where: { id: paymentId },
    data: { status: "REFUNDED" },
  });
  return ok();
}

export async function markPayoutReleased(
  paymentId: string,
  adminUser: CurrentUser
): Promise<ActionResult> {
  if (adminUser.role !== "ADMIN") return fail("Admin only.");
  await prisma.payment.update({
    where: { id: paymentId },
    data: { status: "RELEASED" },
  });
  return ok();
}
