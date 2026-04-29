import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { EmptyState } from "@/components/shared/empty-state";
import { timeAgo } from "@/lib/dates";
import { markAllReadAction } from "@/app/actions/notification";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const user = await requireUser();
  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const hasUnread = notifications.some((n) => !n.readAt);

  return (
    <div className="container-app py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Notifications</h1>
        {hasUnread && (
          <form action={markAllReadAction}>
            <button className="btn-secondary text-sm">Mark all read</button>
          </form>
        )}
      </div>
      {notifications.length === 0 ? (
        <EmptyState title="You're all caught up." description="No notifications yet." />
      ) : (
        <div className="card divide-y divide-gray-100">
          {notifications.map((n) => (
            <Link
              key={n.id}
              href={n.bookingId ? `/dashboard/bookings/${n.bookingId}` : "/dashboard"}
              className={`flex items-start gap-3 p-4 hover:bg-gray-50 ${
                !n.readAt ? "bg-brand-50/40" : ""
              }`}
            >
              <span
                className={`mt-1 h-2 w-2 rounded-full ${
                  !n.readAt ? "bg-brand-500" : "bg-gray-300"
                }`}
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{n.title}</div>
                <div className="text-sm text-gray-700 line-clamp-2">{n.body}</div>
                <div className="text-xs text-gray-500 mt-0.5">{timeAgo(n.createdAt)}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
