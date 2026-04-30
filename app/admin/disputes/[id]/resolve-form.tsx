"use client";
import { useFormState } from "react-dom";
import { resolveDisputeAction, rejectDisputeAction } from "@/app/actions/dispute";
import { SubmitButton } from "@/components/forms/submit-button";
import { FormError } from "@/components/forms/form-error";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function ResolveDisputeForm({ disputeId }: { disputeId: string }) {
  const [state, action] = useFormState<{ ok: boolean; error?: string }, FormData>(
    resolveDisputeAction,
    { ok: false, error: "" }
  );
  const [pending, start] = useTransition();
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const router = useRouter();

  function reject() {
    const reason = rejectReason.trim();
    if (reason.length < 5) return;
    start(async () => {
      const r = await rejectDisputeAction(disputeId, reason);
      if (r.ok) {
        toast.success("Dispute rejected.");
        setRejectOpen(false);
        router.refresh();
      } else {
        toast.error(r.error || "Failed.");
      }
    });
  }

  return (
    <form action={action} className="card p-5 space-y-3">
      <input type="hidden" name="disputeId" value={disputeId} />
      <h2 className="font-semibold">Resolve dispute</h2>
      <div>
        <label className="label">Decision</label>
        <textarea name="decision" required rows={4} className="input" />
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div>
          <label className="label">Refund amount (৳, optional)</label>
          <input type="number" step="0.01" name="refundAmount" className="input" />
        </div>
        <div>
          <label className="label">Deduction amount (৳, optional)</label>
          <input type="number" step="0.01" name="deductionAmount" className="input" />
        </div>
      </div>
      {!state.ok && state.error && <FormError message={state.error} />}
      <div className="flex gap-2">
        <SubmitButton>Resolve</SubmitButton>
        <button type="button" disabled={pending} className="btn-ghost text-red-700" onClick={() => setRejectOpen((v) => !v)}>
          Reject dispute
        </button>
      </div>
      {rejectOpen && (
        <div className="border-t border-gray-100 pt-3">
          <label className="label">Reject reason</label>
          <textarea
            rows={2}
            value={rejectReason}
            onChange={(event) => setRejectReason(event.target.value)}
            className="input"
            placeholder="Reason for rejecting the dispute"
          />
          <div className="mt-2 flex gap-2">
            <button type="button" disabled={pending} className="btn-secondary" onClick={reject}>
              Confirm rejection
            </button>
            <button type="button" className="btn-ghost" onClick={() => setRejectOpen(false)}>
              Keep open
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
