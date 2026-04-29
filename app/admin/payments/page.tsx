import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatBDT } from "@/lib/money";
import { formatDateTime } from "@/lib/dates";
import { PaymentRowActions } from "./payment-actions";

export const dynamic = "force-dynamic";

export default async function AdminPayments() {
  await requireAdmin();
  const payments = await prisma.payment.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      booking: {
        select: { id: true, listing: { select: { title: true } }, renter: { select: { name: true } } },
      },
    },
  });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Payments</h1>
      <div className="card divide-y divide-gray-100">
        {payments.length === 0 && <p className="p-4 text-sm text-gray-500">No payments.</p>}
        {payments.map((p) => (
          <div key={p.id} className="p-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="font-medium">
                {formatBDT(p.amount)} · {p.method.replace(/_/g, " ").toLowerCase()} · {p.type.replace(/_/g, " ").toLowerCase()}
              </div>
              <div className="text-xs text-gray-500">
                {p.booking.renter.name} · {p.booking.listing.title} · {formatDateTime(p.createdAt)}
                {p.transactionId && <> · TXN {p.transactionId}</>}
              </div>
              <div className="mt-1">
                <Link
                  href={`/dashboard/bookings/${p.bookingId}`}
                  className="text-xs text-brand-700 hover:underline"
                >
                  View booking
                </Link>
                {p.proofImageUrl && (
                  <a
                    href={p.proofImageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-brand-700 hover:underline ml-3"
                  >
                    View proof
                  </a>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={p.status} />
              <PaymentRowActions paymentId={p.id} status={p.status} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
