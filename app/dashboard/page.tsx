import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { Calendar, Heart, MessageSquare, Bell, AlertTriangle, ClipboardList } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";

export const dynamic = "force-dynamic";

export default async function DashboardHome() {
  const user = await requireUser();

  const [upcoming, active, disputed, favorites, unreadNotifs, unreadMsgs] = await Promise.all([
    prisma.booking.count({
      where: {
        renterId: user.id,
        status: { in: ["REQUESTED", "ACCEPTED", "PAYMENT_PENDING", "CONFIRMED", "PICKUP_SCHEDULED"] },
      },
    }),
    prisma.booking.count({
      where: { renterId: user.id, status: { in: ["IN_USE", "STARTED", "RETURN_REQUESTED"] } },
    }),
    prisma.booking.count({
      where: { OR: [{ renterId: user.id }, { ownerId: user.id }], status: "DISPUTED" },
    }),
    prisma.favorite.count({ where: { userId: user.id } }),
    prisma.notification.count({ where: { userId: user.id, readAt: null } }),
    prisma.message.count({ where: { receiverId: user.id, readAt: null } }),
  ]);

  return (
    <div className="container-app py-6 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold">Hello, {user.name.split(" ")[0]}!</h1>
          <p className="text-sm text-gray-600">Here&apos;s what&apos;s happening on your account.</p>
        </div>
        <form action={logoutAction}>
          <button className="btn-ghost text-sm">Log out</button>
        </form>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        <DashboardCard
          title="Upcoming bookings"
          value={upcoming}
          href="/dashboard/bookings?filter=upcoming"
          icon={<Calendar size={18} />}
        />
        <DashboardCard
          title="Active bookings"
          value={active}
          href="/dashboard/bookings?filter=active"
          icon={<ClipboardList size={18} />}
        />
        <DashboardCard
          title="Disputes"
          value={disputed}
          href="/dashboard/bookings?filter=disputed"
          icon={<AlertTriangle size={18} />}
        />
        <DashboardCard
          title="Favorites"
          value={favorites}
          href="/dashboard/favorites"
          icon={<Heart size={18} />}
        />
        <DashboardCard
          title="Unread notifications"
          value={unreadNotifs}
          href="/dashboard/notifications"
          icon={<Bell size={18} />}
        />
        <DashboardCard
          title="Unread messages"
          value={unreadMsgs}
          href="/dashboard/messages"
          icon={<MessageSquare size={18} />}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <div className="card p-4">
          <h2 className="font-semibold">Quick actions</h2>
          <ul className="mt-2 space-y-1 text-sm">
            <li>
              <Link href="/listings" className="text-brand-700 hover:underline">
                → Browse listings
              </Link>
            </li>
            {user.role !== "PROVIDER" && (
              <li>
                <Link href="/dashboard/profile" className="text-brand-700 hover:underline">
                  → Contact support to become a provider
                </Link>
              </li>
            )}
            <li>
              <Link href="/dashboard/profile" className="text-brand-700 hover:underline">
                → Update your profile
              </Link>
            </li>
          </ul>
        </div>
        <div className="card p-4">
          <h2 className="font-semibold">Tips</h2>
          <p className="mt-2 text-sm text-gray-600">
            Always take handover photos for tool rentals. Use messages within the booking to keep a record.
          </p>
        </div>
      </div>
    </div>
  );
}
