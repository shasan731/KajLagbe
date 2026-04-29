"use client";
import { useFormState } from "react-dom";
import { useState } from "react";
import { createDisputeAction } from "@/app/actions/dispute";
import { SubmitButton } from "@/components/forms/submit-button";
import { StatusBadge } from "@/components/shared/status-badge";

type Dispute = {
  id: string;
  type: string;
  title: string;
  description: string;
  status: string;
  adminDecision: string | null;
  createdAt: string;
};

export function DisputeSection({
  bookingId,
  status,
  existingDisputes,
}: {
  bookingId: string;
  status: string;
  existingDisputes: Dispute[];
}) {
  const [open, setOpen] = useState(false);
  const [state, action] = useFormState<{ ok: boolean; error?: string }, FormData>(
    createDisputeAction,
    { ok: false, error: "" }
  );

  const allowedToDispute =
    status !== "CANCELLED" && status !== "DRAFT" && status !== "REQUESTED";

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Disputes</h2>
        {allowedToDispute && (
          <button className="btn-secondary text-sm" onClick={() => setOpen((v) => !v)}>
            {open ? "Cancel" : "Open dispute"}
          </button>
        )}
      </div>

      {open && (
        <form action={action} className="mt-3 space-y-2 border-t border-gray-100 pt-3">
          <input type="hidden" name="bookingId" value={bookingId} />
          <div>
            <label className="label">Type</label>
            <select name="type" className="input">
              <option value="ITEM_DAMAGED">Item damaged</option>
              <option value="ITEM_NOT_RETURNED">Item not returned</option>
              <option value="FAKE_LISTING">Fake listing</option>
              <option value="SERVICE_INCOMPLETE">Service incomplete</option>
              <option value="PROVIDER_NO_SHOW">Provider no-show</option>
              <option value="CUSTOMER_NO_SHOW">Customer no-show</option>
              <option value="PAYMENT_ISSUE">Payment issue</option>
              <option value="DEPOSIT_ISSUE">Deposit issue</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div>
            <label className="label">Title</label>
            <input name="title" required className="input" />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea name="description" required rows={4} className="input" />
          </div>
          <div>
            <label className="label">Claimed amount (৳, optional)</label>
            <input type="number" step="0.01" name="claimedAmount" className="input" />
          </div>
          <div>
            <label className="label">Evidence URL (optional)</label>
            <input type="url" name="evidenceUrls" className="input" />
          </div>
          {!state.ok && state.error && (
            <p className="text-sm text-red-700">{state.error}</p>
          )}
          <SubmitButton variant="danger">Submit dispute</SubmitButton>
        </form>
      )}

      {existingDisputes.length > 0 && (
        <div className="mt-4 space-y-2">
          {existingDisputes.map((d) => (
            <div key={d.id} className="rounded-lg border border-gray-100 p-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{d.title}</span>
                <StatusBadge status={d.status} />
              </div>
              <p className="text-sm text-gray-700 mt-1 whitespace-pre-line">
                {d.description}
              </p>
              {d.adminDecision && (
                <p className="text-sm text-emerald-800 mt-2">
                  <span className="font-semibold">Admin decision:</span> {d.adminDecision}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
