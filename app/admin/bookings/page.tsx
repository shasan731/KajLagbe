import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDateTime } from "@/lib/dates";
import { formatBDT } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function AdminBookings() {
  await requireAdmin();
  const bookings = await prisma.booking.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      listing: { select: { title: true } },
      renter: { select: { name: true } },
      owner: { select: { name: true } },
    },
  });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Bookings</h1>
      <div className="card divide-y divide-gray-100">
        {bookings.map((b) => (
          <Link
            key={b.id}
            href={`/admin/bookings/${b.id}`}
            className="flex items-center justify-between p-4 hover:bg-gray-50"
          >
            <div className="min-w-0">
              <div className="font-medium truncate">{b.listing.title}</div>
              <div className="text-xs text-gray-500">
                {b.renter.name} → {b.owner.name} · {formatDateTime(b.startAt)} · {formatBDT(b.totalAmount)}
              </div>
            </div>
            <StatusBadge status={b.status} />
          </Link>
        ))}
      </div>
    </div>
  );
}
