import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDateTime } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default async function AdminDisputes() {
  await requireAdmin();
  const disputes = await prisma.dispute.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      raisedBy: { select: { name: true } },
      booking: { select: { listing: { select: { title: true } } } },
    },
  });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Disputes</h1>
      <div className="card divide-y divide-gray-100">
        {disputes.length === 0 && <p className="p-4 text-sm text-gray-500">No disputes.</p>}
        {disputes.map((d) => (
          <Link
            key={d.id}
            href={`/admin/disputes/${d.id}`}
            className="flex items-center justify-between p-4 hover:bg-gray-50"
          >
            <div>
              <div className="font-medium">{d.title}</div>
              <div className="text-xs text-gray-500">
                {d.raisedBy.name} · {d.booking.listing.title} · {formatDateTime(d.createdAt)}
              </div>
            </div>
            <StatusBadge status={d.status} />
          </Link>
        ))}
      </div>
    </div>
  );
}
