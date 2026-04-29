import { requireProvider } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatBDT } from "@/lib/money";
import { formatDateTime } from "@/lib/dates";
import { StatusBadge } from "@/components/shared/status-badge";

export const dynamic = "force-dynamic";

export default async function EarningsPage() {
  const user = await requireProvider();
  const completed = await prisma.booking.findMany({
    where: { ownerId: user.id, status: "COMPLETED" },
    orderBy: { completedAt: "desc" },
    include: { listing: { select: { title: true } } },
  });
  const totalBase = completed.reduce((s, b) => s + Number(b.baseFee), 0);
  const totalCommission = completed.reduce((s, b) => s + Number(b.platformFee), 0);
  const net = totalBase - totalCommission;

  return (
    <div className="container-app py-6 space-y-4">
      <h1 className="text-2xl font-semibold">Earnings</h1>
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-4">
          <div className="text-sm text-gray-600">Gross (base fees)</div>
          <div className="mt-1 text-2xl font-semibold">{formatBDT(totalBase)}</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-gray-600">Platform commission</div>
          <div className="mt-1 text-2xl font-semibold text-amber-700">{formatBDT(totalCommission)}</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-gray-600">Estimated net</div>
          <div className="mt-1 text-2xl font-semibold text-emerald-700">{formatBDT(net)}</div>
        </div>
      </div>

      {completed.length === 0 ? (
        <p className="text-sm text-gray-500">No completed bookings yet.</p>
      ) : (
        <div className="card divide-y divide-gray-100">
          {completed.map((b) => (
            <div key={b.id} className="flex items-center justify-between p-4">
              <div>
                <div className="font-medium">{b.listing.title}</div>
                <div className="text-xs text-gray-500">
                  Completed {formatDateTime(b.completedAt)}
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold">{formatBDT(b.baseFee)}</div>
                <div className="text-xs text-gray-500">
                  − {formatBDT(b.platformFee)} commission
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
