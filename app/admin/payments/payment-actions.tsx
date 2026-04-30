"use client";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  payoutPaymentAction,
  refundPaymentAction,
  rejectPaymentAction,
  verifyPaymentAction,
} from "@/app/actions/payment";

export function PaymentRowActions({
  paymentId,
  status,
}: {
  paymentId: string;
  status: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");
  function run(label: string, fn: () => Promise<{ ok: boolean; error?: string }>) {
    start(async () => {
      const r = await fn();
      if (r.ok) {
        toast.success(label);
        router.refresh();
      } else {
        toast.error(r.error || "Failed.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      {status === "SUBMITTED" && (
        <>
          <button
            disabled={pending}
            className="btn-primary text-xs"
            onClick={() => run("Verified", () => verifyPaymentAction(paymentId))}
          >
            Verify
          </button>
          <button
            disabled={pending}
            className="btn-secondary text-xs"
            onClick={() => setRejectOpen((v) => !v)}
          >
            Reject
          </button>
          {rejectOpen && (
            <form
              className="flex gap-1"
              onSubmit={(event) => {
                event.preventDefault();
                if (!reason.trim()) return;
                run("Rejected", () => rejectPaymentAction(paymentId, reason.trim()));
              }}
            >
              <input
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                className="input h-9 w-40 text-xs"
                placeholder="Reject reason"
              />
              <button disabled={pending} className="btn-secondary text-xs">
                Save
              </button>
            </form>
          )}
        </>
      )}
      {status === "VERIFIED" && (
        <>
          <button
            disabled={pending}
            className="btn-secondary text-xs"
            onClick={() => run("Refunded", () => refundPaymentAction(paymentId))}
          >
            Mark refunded
          </button>
          <button
            disabled={pending}
            className="btn-secondary text-xs"
            onClick={() => run("Released", () => payoutPaymentAction(paymentId))}
          >
            Release payout
          </button>
        </>
      )}
    </div>
  );
}
