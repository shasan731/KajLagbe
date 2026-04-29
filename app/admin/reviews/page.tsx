import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { RatingStars } from "@/components/shared/rating-stars";
import { formatDateTime } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default async function AdminReviews() {
  await requireAdmin();
  const reviews = await prisma.review.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      reviewer: { select: { name: true } },
      reviewedUser: { select: { name: true } },
    },
  });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Reviews</h1>
      <div className="card divide-y divide-gray-100">
        {reviews.map((r) => (
          <div key={r.id} className="p-4">
            <div className="flex items-center gap-2">
              <RatingStars rating={r.rating} />
              <span className="text-sm">
                <span className="font-medium">{r.reviewer.name}</span> →{" "}
                <span className="font-medium">{r.reviewedUser.name}</span>
              </span>
              <span className="ml-auto text-xs text-gray-500">{formatDateTime(r.createdAt)}</span>
            </div>
            {r.comment && <p className="mt-1 text-sm text-gray-700">{r.comment}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
