import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { StatusBadge } from "@/components/shared/status-badge";
import { BookingTimeline } from "@/components/bookings/booking-timeline";
import { formatBDT } from "@/lib/money";
import { formatDateTime } from "@/lib/dates";
import { BookingActions } from "./booking-actions";
import { PaymentSection } from "./payment-section";
import { MessageThread } from "./message-thread";
import { ReviewSection } from "./review-section";
import { DisputeSection } from "./dispute-section";
import { QuoteForm } from "./quote-form";

export const dynamic = "force-dynamic";

type Props = { params: { id: string } };

export default async function BookingDetailPage({ params }: Props) {
  const user = await requireUser();
  const booking = await prisma.booking.findUnique({
    where: { id: params.id },
    include: {
      listing: { select: { id: true, title: true, slug: true, listingType: true, priceType: true } },
      owner: { select: { id: true, name: true, phone: true } },
      renter: { select: { id: true, name: true, phone: true } },
      statusHistory: { orderBy: { createdAt: "asc" } },
      payments: { orderBy: { createdAt: "desc" } },
      handovers: { include: { media: true } },
      messages: {
        orderBy: { createdAt: "asc" },
        include: { sender: { select: { id: true, name: true } } },
      },
      reviews: true,
      disputes: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!booking) notFound();
  const isRenter = booking.renterId === user.id;
  const isOwner = booking.ownerId === user.id;
  if (!isRenter && !isOwner && user.role !== "ADMIN") notFound();

  const counterPart = isRenter ? booking.owner : booking.renter;

  return (
    <div className="container-app py-6 grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <div className="card p-5">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-semibold">
                <Link href={`/listings/${booking.listing.slug}`} className="hover:underline">
                  {booking.listing.title}
                </Link>
              </h1>
              <div className="text-sm text-gray-600 mt-1">
                {isRenter ? "Provider" : "Customer"}: {counterPart.name} · {counterPart.phone}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Starts: {formatDateTime(booking.startAt)}
                {booking.endAt && <> · Ends: {formatDateTime(booking.endAt)}</>}
              </div>
              {booking.jobDescription && (
                <p className="text-sm mt-2 text-gray-700">
                  <span className="font-medium">Job:</span> {booking.jobDescription}
                </p>
              )}
            </div>
            <StatusBadge status={booking.status} />
          </div>

          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <Money label="Base fee" value={booking.baseFee} />
            <Money label="Platform fee" value={booking.platformFee} />
            <Money label="Deposit" value={booking.depositAmount} />
            <Money label="Total" value={booking.totalAmount} bold />
          </div>
        </div>

        <BookingActions
          booking={JSON.parse(JSON.stringify(booking))}
          isRenter={isRenter}
          isOwner={isOwner}
          isAdmin={user.role === "ADMIN"}
        />

        {isOwner &&
          booking.status === "REQUESTED" &&
          booking.listing.priceType === "CUSTOM_QUOTE" && (
            <div className="card p-5">
              <h2 className="font-semibold">Send custom quote</h2>
              <p className="text-sm text-gray-600 mt-1">
                Customer is asking for a quote. Send your price and they can accept it before payment.
              </p>
              <QuoteForm bookingId={booking.id} />
            </div>
          )}

        <PaymentSection
          bookingId={booking.id}
          status={booking.status}
          isRenter={isRenter}
          payments={JSON.parse(JSON.stringify(booking.payments))}
          totalDue={Number(booking.totalAmount)}
        />

        <MessageThread
          bookingId={booking.id}
          currentUserId={user.id}
          messages={JSON.parse(JSON.stringify(booking.messages))}
        />

        <DisputeSection
          bookingId={booking.id}
          status={booking.status}
          existingDisputes={JSON.parse(JSON.stringify(booking.disputes))}
        />

        <ReviewSection
          bookingId={booking.id}
          status={booking.status}
          alreadyReviewed={booking.reviews.some((r) => r.reviewerId === user.id)}
        />
      </div>
      <aside className="space-y-4">
        <div className="card p-5">
          <h3 className="font-semibold mb-3">Timeline</h3>
          <BookingTimeline history={booking.statusHistory} currentStatus={booking.status} />
        </div>
      </aside>
    </div>
  );
}

function Money({
  label,
  value,
  bold,
}: {
  label: string;
  value: number | string | { toString(): string };
  bold?: boolean;
}) {
  return (
    <div>
      <div className="text-xs text-gray-500">{label}</div>
      <div className={bold ? "font-semibold" : "font-medium"}>{formatBDT(value)}</div>
    </div>
  );
}
