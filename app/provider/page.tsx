import Link from "next/link";
import { requireProvider } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { ClipboardList, ClockIcon, Calendar, Star, Wallet } from "lucide-react";
import { formatBDT } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function ProviderHome() {
  const user = await requireProvider();

  const [
    pendingRequests,
    activeBookings,
    activeListings,
    pendingListings,
    completed,
    earnings,
    avgRating,
  ] = await Promise.all([
    prisma.booking.count({ where: { ownerId: user.id, status: "REQUESTED" } }),
    prisma.booking.count({
      where: {
        ownerId: user.id,
        status: { in: ["ACCEPTED", "CONFIRMED", "PICKUP_SCHEDULED", "IN_USE", "STARTED"] },
      },
    }),
    prisma.listing.count({ where: { ownerId: user.id, status: "ACTIVE" } }),
    prisma.listing.count({ where: { ownerId: user.id, status: "PENDING_REVIEW" } }),
    prisma.booking.count({ where: { ownerId: user.id, status: "COMPLETED" } }),
    prisma.booking.aggregate({
      where: { ownerId: user.id, status: "COMPLETED" },
      _sum: { baseFee: true },
    }),
    prisma.review.aggregate({ where: { reviewedUserId: user.id }, _avg: { rating: true } }),
  ]);

  return (
    <div className="container-app py-6 space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Provider dashboard</h1>
          <p className="text-sm text-gray-600">Manage your listings and bookings.</p>
        </div>
        <Link href="/provider/listings/new" className="btn-primary">
          + New listing
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        <DashboardCard
          title="Pending requests"
          value={pendingRequests}
          icon={<ClockIcon size={18} />}
          href="/provider/bookings?filter=requested"
        />
        <DashboardCard
          title="Active bookings"
          value={activeBookings}
          icon={<Calendar size={18} />}
          href="/provider/bookings?filter=active"
        />
        <DashboardCard
          title="Active listings"
          value={activeListings}
          icon={<ClipboardList size={18} />}
          href="/provider/listings"
        />
        <DashboardCard
          title="Pending review"
          value={pendingListings}
          hint="Awaiting admin moderation"
          href="/provider/listings"
        />
        <DashboardCard
          title="Completed bookings"
          value={completed}
          icon={<Calendar size={18} />}
        />
        <DashboardCard
          title="Estimated earnings"
          value={formatBDT(earnings._sum.baseFee ?? 0)}
          hint="Sum of base fees from completed bookings"
          icon={<Wallet size={18} />}
        />
        <DashboardCard
          title="Average rating"
          value={(avgRating._avg.rating ?? 0).toFixed(1)}
          icon={<Star size={18} />}
          href="/provider/reviews"
        />
      </div>
    </div>
  );
}
