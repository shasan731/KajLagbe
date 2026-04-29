"use client";
import { useFormState } from "react-dom";
import { resolveDisputeAction, rejectDisputeAction } from "@/app/actions/dispute";
import { SubmitButton } from "@/components/forms/submit-button";
import { FormError } from "@/components/forms/form-error";
import { useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function ResolveDisputeForm({ disputeId }: { disputeId: string }) {
  const [state, action] = useFormState<{ ok: boolean; error?: string }, FormData>(
    resolveDisputeAction,
    { ok: false, error: "" }
  );
  const [pending, start] = useTransition();
  const router = useRouter();

  function reject() {
    const reason = prompt("Reason for rejecting the dispute?") || "";
    if (reason.length < 5) return;
    start(async () => {
      const r = await rejectDisputeAction(disputeId, reason);
      if (r.ok) {
        toast.success("Dispute rejected.");
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
      <div className="grid grid-cols-2 gap-2">
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
        <button type="button" disabled={pending} className="btn-ghost text-red-700" onClick={reject}>
          Reject dispute
        </button>
      </div>
    </form>
  );
}
