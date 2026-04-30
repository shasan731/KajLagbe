import { formatDateTime } from "@/lib/dates";
import type { BookingStatusHistory, BookingStatus } from "@prisma/client";

export function BookingTimeline({
  history,
  currentStatus,
}: {
  history: BookingStatusHistory[];
  currentStatus: BookingStatus;
}) {
  if (history.length === 0) {
    return (
      <div className="text-sm text-gray-500">
        Current status: {currentStatus.replace(/_/g, " ").toLowerCase()}
      </div>
    );
  }
  return (
    <ol className="relative border-l border-gray-200 pl-4 space-y-4">
      {history.map((h) => {
        const active = h.newStatus === currentStatus;
        return (
        <li key={h.id}>
          <span
            className={`absolute -left-1.5 mt-1 h-3 w-3 rounded-full ${
              active ? "bg-brand-600 ring-4 ring-brand-100" : "bg-gray-300"
            }`}
          />
          <div className="text-sm font-medium text-gray-900">
            {h.newStatus.replace(/_/g, " ").toLowerCase()}
          </div>
          <div className="text-xs text-gray-500">{formatDateTime(h.createdAt)}</div>
          {h.note && <p className="mt-1 text-xs text-gray-600">{h.note}</p>}
        </li>
        );
      })}
    </ol>
  );
}
