"use client";
import { useTransition } from "react";
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
    <div className="flex gap-1">
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
            onClick={() => {
              const reason = prompt("Reason?") || "";
              if (!reason) return;
              run("Rejected", () => rejectPaymentAction(paymentId, reason));
            }}
          >
            Reject
          </button>
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
