import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatBDT } from "@/lib/money";
import { ResolveDisputeForm } from "./resolve-form";

export const dynamic = "force-dynamic";

type Props = { params: { id: string } };

export default async function AdminDisputeDetail({ params }: Props) {
  await requireAdmin();
  const dispute = await prisma.dispute.findUnique({
    where: { id: params.id },
    include: {
      booking: {
        include: {
          listing: { select: { title: true, slug: true } },
          renter: { select: { name: true, phone: true } },
          owner: { select: { name: true, phone: true } },
          payments: true,
        },
      },
      raisedBy: { select: { name: true } },
      evidence: true,
    },
  });
  if (!dispute) notFound();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{dispute.title}</h1>
          <div className="text-sm text-gray-600 mt-1">
            Raised by {dispute.raisedBy.name} · type {dispute.type.replace(/_/g, " ").toLowerCase()}
          </div>
        </div>
        <StatusBadge status={dispute.status} />
      </div>

      <div className="card p-5">
        <h2 className="font-semibold">Description</h2>
        <p className="mt-1 text-sm whitespace-pre-line">{dispute.description}</p>
        {dispute.claimedAmount && (
          <p className="mt-2 text-sm">
            Claimed amount: <span className="font-semibold">{formatBDT(dispute.claimedAmount)}</span>
          </p>
        )}
      </div>

      <div className="card p-5">
        <h2 className="font-semibold">Booking</h2>
        <p className="text-sm mt-1">
          <Link href={`/dashboard/bookings/${dispute.bookingId}`} className="text-brand-700 hover:underline">
            {dispute.booking.listing.title}
          </Link>
        </p>
        <div className="mt-2 text-sm text-gray-600">
          Renter: {dispute.booking.renter.name} ({dispute.booking.renter.phone}) · Owner: {dispute.booking.owner.name} ({dispute.booking.owner.phone})
        </div>
        <div className="mt-2 text-sm">
          Total {formatBDT(dispute.booking.totalAmount)} · {dispute.booking.payments.length} payment record(s)
        </div>
      </div>

      {dispute.evidence.length > 0 && (
        <div className="card p-5">
          <h2 className="font-semibold">Evidence</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {dispute.evidence.map((e) => (
              <li key={e.id}>
                {e.url && (
                  <a href={e.url} target="_blank" rel="noreferrer" className="text-brand-700 hover:underline">
                    {e.url}
                  </a>
                )}
                {e.text && <span className="ml-1 text-gray-700">{e.text}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {dispute.status === "OPEN" || dispute.status === "IN_REVIEW" ? (
        <ResolveDisputeForm disputeId={dispute.id} />
      ) : (
        <div className="card p-5">
          <h2 className="font-semibold">Decision</h2>
          <p className="mt-1 text-sm whitespace-pre-line">{dispute.adminDecision}</p>
        </div>
      )}
    </div>
  );
}
