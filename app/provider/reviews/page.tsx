import { requireProvider } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { RatingStars } from "@/components/shared/rating-stars";
import { UserAvatar } from "@/components/shared/user-avatar";
import { formatDateTime } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default async function ProviderReviews() {
  const user = await requireProvider();
  const reviews = await prisma.review.findMany({
    where: { reviewedUserId: user.id },
    orderBy: { createdAt: "desc" },
    include: { reviewer: { select: { name: true } } },
  });

  return (
    <div className="container-app py-6 space-y-4">
      <h1 className="text-2xl font-semibold">Reviews</h1>
      {reviews.length === 0 ? (
        <p className="text-sm text-gray-500">No reviews yet.</p>
      ) : (
        <div className="card divide-y divide-gray-100">
          {reviews.map((r) => (
            <div key={r.id} className="p-4">
              <div className="flex items-center gap-2">
                <UserAvatar name={r.reviewer.name} size={32} />
                <span className="font-medium">{r.reviewer.name}</span>
                <RatingStars rating={r.rating} />
                <span className="ml-auto text-xs text-gray-500">
                  {formatDateTime(r.createdAt)}
                </span>
              </div>
              {r.comment && <p className="mt-2 text-sm text-gray-700">{r.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
