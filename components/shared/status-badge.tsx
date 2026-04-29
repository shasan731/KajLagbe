import type {
  BookingStatus,
  ListingStatus,
  PaymentStatus,
  DisputeStatus,
} from "@prisma/client";

const colorMap: Record<string, string> = {
  // Listing
  DRAFT: "bg-gray-100 text-gray-700",
  PENDING_REVIEW: "bg-amber-100 text-amber-800",
  ACTIVE: "bg-emerald-100 text-emerald-800",
  REJECTED: "bg-red-100 text-red-800",
  SUSPENDED: "bg-red-100 text-red-800",
  ARCHIVED: "bg-gray-100 text-gray-600",
  // Booking
  REQUESTED: "bg-blue-100 text-blue-800",
  QUOTE_SENT: "bg-indigo-100 text-indigo-800",
  ACCEPTED: "bg-emerald-100 text-emerald-800",
  PAYMENT_PENDING: "bg-amber-100 text-amber-800",
  CONFIRMED: "bg-emerald-100 text-emerald-800",
  PICKUP_SCHEDULED: "bg-cyan-100 text-cyan-800",
  IN_USE: "bg-indigo-100 text-indigo-800",
  RETURN_DUE: "bg-amber-100 text-amber-800",
  RETURN_REQUESTED: "bg-amber-100 text-amber-800",
  RETURN_CONFIRMED: "bg-emerald-100 text-emerald-800",
  PROVIDER_ON_WAY: "bg-cyan-100 text-cyan-800",
  STARTED: "bg-indigo-100 text-indigo-800",
  COMPLETED_BY_PROVIDER: "bg-emerald-100 text-emerald-800",
  CONFIRMED_BY_CUSTOMER: "bg-emerald-100 text-emerald-800",
  COMPLETED: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-gray-200 text-gray-700",
  DISPUTED: "bg-red-100 text-red-800",
  // Payment
  PENDING: "bg-gray-100 text-gray-700",
  SUBMITTED: "bg-amber-100 text-amber-800",
  VERIFIED: "bg-emerald-100 text-emerald-800",
  REFUNDED: "bg-blue-100 text-blue-800",
  RELEASED: "bg-emerald-100 text-emerald-800",
  // Dispute
  OPEN: "bg-amber-100 text-amber-800",
  IN_REVIEW: "bg-cyan-100 text-cyan-800",
  RESOLVED: "bg-emerald-100 text-emerald-800",
};

type Status = BookingStatus | ListingStatus | PaymentStatus | DisputeStatus | string;

export function StatusBadge({ status }: { status: Status }) {
  const cls = colorMap[status] ?? "bg-gray-100 text-gray-700";
  return (
    <span className={`badge ${cls}`}>
      {String(status).replace(/_/g, " ").toLowerCase()}
    </span>
  );
}
