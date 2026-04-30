import "server-only";
import { prisma } from "../db";
import { reviewSchema } from "../validators/review";
import { fail, flattenZodError, ok, type ActionResult } from "../actions";
import { createNotification } from "./notification-service";
import { Prisma } from "@prisma/client";

type CurrentUser = { id: string; role: "CUSTOMER" | "PROVIDER" | "ADMIN" };

export async function createReview(
  raw: unknown,
  currentUser: CurrentUser
): Promise<ActionResult<{ id: string }>> {
  const parsed = reviewSchema.safeParse(raw);
  if (!parsed.success) return fail("Invalid review.", flattenZodError(parsed.error));
  const booking = await prisma.booking.findUnique({
    where: { id: parsed.data.bookingId },
    include: { listing: true },
  });
  if (!booking) return fail("Booking not found.");
  if (booking.status !== "COMPLETED") {
    return fail("You can only review completed bookings.");
  }
  if (booking.renterId !== currentUser.id && booking.ownerId !== currentUser.id) {
    return fail("Not authorized to review this booking.");
  }
  const reviewedUserId =
    currentUser.id === booking.renterId ? booking.ownerId : booking.renterId;

  const existing = await prisma.review.findUnique({
    where: { bookingId_reviewerId: { bookingId: booking.id, reviewerId: currentUser.id } },
  });
  if (existing) return fail("You have already reviewed this booking.");

  let review: { id: string };
  try {
    review = await prisma.$transaction(async (tx) => {
      const created = await tx.review.create({
        data: {
          bookingId: booking.id,
          reviewerId: currentUser.id,
          reviewedUserId,
          listingId: booking.listingId,
          rating: parsed.data.rating,
          comment: parsed.data.comment ?? null,
        },
      });
      const [userAgg, listingAgg] = await Promise.all([
        tx.review.aggregate({
          where: { reviewedUserId },
          _avg: { rating: true },
          _count: { rating: true },
        }),
        tx.review.aggregate({
          where: { listingId: booking.listingId },
          _avg: { rating: true },
          _count: { rating: true },
        }),
      ]);
      await Promise.all([
        tx.user.update({
          where: { id: reviewedUserId },
          data: {
            averageRating: userAgg._avg.rating ?? 0,
            totalReviews: userAgg._count.rating,
          },
        }),
        tx.listing.update({
          where: { id: booking.listingId },
          data: {
            averageRating: listingAgg._avg.rating ?? 0,
            totalReviews: listingAgg._count.rating,
          },
        }),
      ]);
      return created;
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return fail("You have already reviewed this booking.");
    }
    throw error;
  }

  await Promise.allSettled([createNotification(
    reviewedUserId,
    "REVIEW",
    "New review received",
    `You received a ${parsed.data.rating}-star review.`,
    booking.id
  )]);

  return ok({ id: review.id }, "Review posted.");
}

export async function recalculateUserRating(userId: string): Promise<void> {
  const agg = await prisma.review.aggregate({
    where: { reviewedUserId: userId },
    _avg: { rating: true },
    _count: { rating: true },
  });
  await prisma.user.update({
    where: { id: userId },
    data: {
      averageRating: agg._avg.rating ?? 0,
      totalReviews: agg._count.rating,
    },
  });
}

export async function recalculateListingRating(listingId: string): Promise<void> {
  const agg = await prisma.review.aggregate({
    where: { listingId },
    _avg: { rating: true },
    _count: { rating: true },
  });
  await prisma.listing.update({
    where: { id: listingId },
    data: {
      averageRating: agg._avg.rating ?? 0,
      totalReviews: agg._count.rating,
    },
  });
}

export async function updateTrustScore(userId: string): Promise<void> {
  const [completed, cancelled, reviews] = await Promise.all([
    prisma.booking.count({ where: { ownerId: userId, status: "COMPLETED" } }),
    prisma.booking.count({ where: { ownerId: userId, status: "CANCELLED" } }),
    prisma.review.aggregate({ where: { reviewedUserId: userId }, _avg: { rating: true } }),
  ]);
  const baseline = 50;
  const completedBonus = Math.min(30, completed * 2);
  const cancelledPenalty = Math.min(40, cancelled * 5);
  const ratingBonus = Math.round(((reviews._avg.rating ?? 0) - 3) * 5);
  const score = Math.max(0, Math.min(100, baseline + completedBonus - cancelledPenalty + ratingBonus));
  await prisma.user.update({
    where: { id: userId },
    data: { trustScore: score },
  });
}
