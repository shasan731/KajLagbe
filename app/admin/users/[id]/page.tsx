import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { StatusBadge } from "@/components/shared/status-badge";
import { UserActions } from "./user-actions";
import { formatDateTime } from "@/lib/dates";

export const dynamic = "force-dynamic";

type Props = { params: { id: string } };

export default async function AdminUserDetail({ params }: Props) {
  await requireAdmin();
  const user = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      profile: true,
      _count: { select: { listings: true, ownerBookings: true, renterBookings: true } },
    },
  });
  if (!user) notFound();
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{user.name}</h1>
          <div className="text-sm text-gray-600 mt-1">
            {user.phone} · {user.email ?? "no email"} · joined {formatDateTime(user.createdAt)}
          </div>
        </div>
        <StatusBadge status={user.status} />
      </div>
      <div className="card p-5 grid sm:grid-cols-3 gap-3 text-sm">
        <Detail label="Role" value={user.role} />
        <Detail label="Trust score" value={String(user.trustScore)} />
        <Detail label="Avg rating" value={user.averageRating.toString()} />
        <Detail label="Total reviews" value={String(user.totalReviews)} />
        <Detail label="Listings" value={String(user._count.listings)} />
        <Detail label="As renter" value={String(user._count.renterBookings)} />
        <Detail label="As owner" value={String(user._count.ownerBookings)} />
        <Detail label="City" value={user.profile?.city ?? "—"} />
        <Detail label="Area" value={user.profile?.addressArea ?? "—"} />
      </div>
      <UserActions userId={user.id} role={user.role} status={user.status} />
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-gray-500">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}
