"use client";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  acceptBookingAction,
  cancelBookingAction,
  completeBookingAction,
  confirmQuoteAction,
  confirmServiceAction,
  markPickupScheduledAction,
  markServiceCompletedAction,
  markServiceStartedAction,
  rejectBookingAction,
  requestReturnAction,
  confirmPickupAction,
  confirmReturnAction,
} from "@/app/actions/booking";
import { useRouter } from "next/navigation";
import { useFormState } from "react-dom";
import { SubmitButton } from "@/components/forms/submit-button";

type Booking = {
  id: string;
  status: string;
  listing: { listingType: string };
};

export function BookingActions({
  booking,
  isRenter,
  isOwner,
}: {
  booking: Booking;
  isRenter: boolean;
  isOwner: boolean;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [pickupOpen, setPickupOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);

  function run(label: string, fn: () => Promise<{ ok: boolean; error?: string }>) {
    start(async () => {
      const r = await fn();
      if (r.ok) {
        toast.success(label);
        router.refresh();
      } else {
        toast.error(r.error || "Action failed.");
      }
    });
  }

  const s = booking.status;
  const isToolOnly = booking.listing.listingType === "TOOL_ONLY";

  const buttons: React.ReactNode[] = [];
  if (isOwner) {
    if (s === "REQUESTED")
      buttons.push(
        <button
          key="accept"
          disabled={pending}
          className="btn-primary"
          onClick={() => run("Booking accepted", () => acceptBookingAction(booking.id))}
        >
          Accept
        </button>,
        <button
          key="reject"
          disabled={pending}
          className="btn-secondary"
          onClick={() => setRejectOpen((v) => !v)}
        >
          Reject
        </button>
      );
    if (s === "CONFIRMED" && isToolOnly)
      buttons.push(
        <button
          key="schedule"
          disabled={pending}
          className="btn-primary"
          onClick={() => run("Pickup scheduled", () => markPickupScheduledAction(booking.id))}
        >
          Schedule pickup
        </button>
      );
    if (s === "CONFIRMED" && !isToolOnly)
      buttons.push(
        <button
          key="started"
          disabled={pending}
          className="btn-primary"
          onClick={() => run("Service started", () => markServiceStartedAction(booking.id))}
        >
          Start service
        </button>
      );
    if (s === "STARTED")
      buttons.push(
        <button
          key="completed"
          disabled={pending}
          className="btn-primary"
          onClick={() => run("Marked completed", () => markServiceCompletedAction(booking.id))}
        >
          Mark service complete
        </button>
      );
    if (s === "PICKUP_SCHEDULED" || s === "IN_USE" || s === "RETURN_REQUESTED")
      buttons.push(
        <button
          key="pickup"
          className="btn-secondary"
          onClick={() => setPickupOpen((v) => !v)}
        >
          Confirm pickup
        </button>,
        <button
          key="return"
          className="btn-secondary"
          onClick={() => setReturnOpen((v) => !v)}
        >
          Confirm return
        </button>
      );
    if (s === "RETURN_CONFIRMED")
      buttons.push(
        <button
          key="complete"
          disabled={pending}
          className="btn-primary"
          onClick={() => run("Booking complete", () => completeBookingAction(booking.id))}
        >
          Complete booking
        </button>
      );
  }

  if (isRenter) {
    if (s === "QUOTE_SENT")
      buttons.push(
        <button
          key="acceptQuote"
          disabled={pending}
          className="btn-primary"
          onClick={() => run("Quote accepted", () => confirmQuoteAction(booking.id))}
        >
          Accept quote
        </button>
      );
    if (s === "PICKUP_SCHEDULED" || s === "IN_USE")
      buttons.push(
        <button
          key="pickup-r"
          className="btn-secondary"
          onClick={() => setPickupOpen((v) => !v)}
        >
          Confirm pickup
        </button>
      );
    if (s === "IN_USE")
      buttons.push(
        <button
          key="reqReturn"
          disabled={pending}
          className="btn-primary"
          onClick={() => run("Return requested", () => requestReturnAction(booking.id))}
        >
          Request return
        </button>
      );
    if (s === "RETURN_REQUESTED" || s === "RETURN_CONFIRMED")
      buttons.push(
        <button
          key="returnR"
          className="btn-secondary"
          onClick={() => setReturnOpen((v) => !v)}
        >
          Confirm return
        </button>
      );
    if (s === "COMPLETED_BY_PROVIDER")
      buttons.push(
        <button
          key="confirm"
          disabled={pending}
          className="btn-primary"
          onClick={() => run("Service confirmed", () => confirmServiceAction(booking.id))}
        >
          Confirm service done
        </button>
      );
    if (s === "CONFIRMED_BY_CUSTOMER")
      buttons.push(
        <button
          key="comp"
          disabled={pending}
          className="btn-primary"
          onClick={() => run("Booking complete", () => completeBookingAction(booking.id))}
        >
          Mark complete
        </button>
      );
  }

  // Cancellable states for both
  const canCancel = ![
    "COMPLETED",
    "CANCELLED",
    "DISPUTED",
    "RETURN_CONFIRMED",
    "CONFIRMED_BY_CUSTOMER",
  ].includes(s);
  if (canCancel) {
    buttons.push(
      <button key="cancel" className="btn-ghost text-red-700" onClick={() => setCancelOpen((v) => !v)}>
        Cancel booking
      </button>
    );
  }

  if (buttons.length === 0 && !cancelOpen) return null;

  return (
    <div className="card p-4 space-y-3">
      <div className="flex flex-wrap gap-2">{buttons}</div>
      {rejectOpen && <RejectForm bookingId={booking.id} onDone={() => setRejectOpen(false)} />}
      {cancelOpen && <CancelForm bookingId={booking.id} onDone={() => setCancelOpen(false)} />}
      {pickupOpen && (
        <HandoverForm
          bookingId={booking.id}
          type="PICKUP"
          onDone={() => setPickupOpen(false)}
        />
      )}
      {returnOpen && (
        <HandoverForm
          bookingId={booking.id}
          type="RETURN"
          onDone={() => setReturnOpen(false)}
        />
      )}
    </div>
  );
}

function RejectForm({ bookingId, onDone }: { bookingId: string; onDone: () => void }) {
  const [reason, setReason] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason.trim()) return;
    start(async () => {
      const result = await rejectBookingAction(bookingId, reason);
      if (result.ok) {
        toast.success("Rejected");
        onDone();
        router.refresh();
      } else {
        toast.error(result.error || "Action failed.");
      }
    });
  }

  return (
    <form onSubmit={submit} className="border-t border-gray-100 pt-3 space-y-2">
      <textarea
        required
        rows={2}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Reason for rejection"
        className="input"
      />
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className="btn-secondary">
          Reject booking
        </button>
        <button type="button" className="btn-ghost" onClick={onDone}>
          Keep request
        </button>
      </div>
    </form>
  );
}

function CancelForm({ bookingId, onDone }: { bookingId: string; onDone: () => void }) {
  const [state, action] = useFormState<
    { ok: boolean; error?: string },
    FormData
  >(cancelBookingAction, { ok: false, error: "" });
  const router = useRouter();
  useEffect(() => {
    if (state.ok) {
      onDone();
      router.refresh();
    }
  }, [state.ok, onDone, router]);
  return (
    <form action={action} className="border-t border-gray-100 pt-3 space-y-2">
      <input type="hidden" name="bookingId" value={bookingId} />
      <textarea
        name="reason"
        required
        rows={2}
        placeholder="Reason for cancellation"
        className="input"
      />
      {!state.ok && state.error && (
        <p className="text-sm text-red-700">{state.error}</p>
      )}
      <div className="flex gap-2">
        <SubmitButton variant="danger">Cancel booking</SubmitButton>
        <button type="button" className="btn-ghost" onClick={onDone}>
          Keep booking
        </button>
      </div>
    </form>
  );
}

function HandoverForm({
  bookingId,
  type,
  onDone,
}: {
  bookingId: string;
  type: "PICKUP" | "RETURN";
  onDone: () => void;
}) {
  const action = type === "PICKUP" ? confirmPickupAction : confirmReturnAction;
  const [state, runAction] = useFormState<
    { ok: boolean; error?: string },
    FormData
  >(action, { ok: false, error: "" });
  const router = useRouter();
  useEffect(() => {
    if (state.ok) {
      onDone();
      router.refresh();
    }
  }, [state.ok, onDone, router]);
  return (
    <form action={runAction} className="border-t border-gray-100 pt-3 space-y-2">
      <input type="hidden" name="bookingId" value={bookingId} />
      <input type="hidden" name="type" value={type} />
      <textarea
        name="conditionNote"
        rows={2}
        placeholder="Condition note (optional)"
        className="input"
      />
      <input
        type="url"
        name="imageUrls"
        placeholder="https://example.com/photo.jpg"
        className="input"
      />
      {!state.ok && state.error && (
        <p className="text-sm text-red-700">{state.error}</p>
      )}
      <div className="flex gap-2">
        <SubmitButton>Confirm {type.toLowerCase()}</SubmitButton>
        <button type="button" className="btn-ghost" onClick={onDone}>
          Cancel
        </button>
      </div>
    </form>
  );
}
