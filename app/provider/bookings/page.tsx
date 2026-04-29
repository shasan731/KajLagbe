import Link from "next/link";
import { requireProvider } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDateTime } from "@/lib/dates";
import { formatBDT } from "@/lib/money";
import { EmptyState } from "@/components/shared/empty-state";

export const dynamic = "force-dynamic";

export default async function ProviderBookings() {
  const user = await requireProvider();
  const bookings = await prisma.booking.findMany({
    where: { ownerId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      listing: { select: { title: true } },
      renter: { select: { name: true, phone: true } },
    },
  });
  return (
    <div className="container-app py-6 space-y-4">
      <h1 className="text-2xl font-semibold">Provider bookings</h1>
      {bookings.length === 0 ? (
        <EmptyState title="No bookings yet." />
      ) : (
        <div className="card divide-y divide-gray-100">
          {bookings.map((b) => (
            <Link
              key={b.id}
              href={`/provider/bookings/${b.id}`}
              className="flex items-center justify-between p-4 hover:bg-gray-50"
            >
              <div>
                <div className="font-medium">{b.listing.title}</div>
                <div className="text-xs text-gray-500">
                  {b.renter.name} ({b.renter.phone}) · Starts {formatDateTime(b.startAt)} · Total {formatBDT(b.totalAmount)}
                </div>
              </div>
              <StatusBadge status={b.status} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
