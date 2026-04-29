"use client";
import { useFormState } from "react-dom";
import { submitPaymentAction } from "@/app/actions/payment";
import { SubmitButton } from "@/components/forms/submit-button";
import { FormError } from "@/components/forms/form-error";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatBDT } from "@/lib/money";
import { formatDateTime } from "@/lib/dates";
import { useState } from "react";

type Payment = {
  id: string;
  amount: string;
  method: string;
  type: string;
  status: string;
  transactionId: string | null;
  createdAt: string;
  proofImageUrl: string | null;
  adminNote: string | null;
};

export function PaymentSection({
  bookingId,
  status,
  isRenter,
  payments,
  totalDue,
}: {
  bookingId: string;
  status: string;
  isRenter: boolean;
  payments: Payment[];
  totalDue: number;
}) {
  const [open, setOpen] = useState(false);
  const [state, action] = useFormState<{ ok: boolean; error?: string }, FormData>(
    submitPaymentAction,
    { ok: false, error: "" }
  );
  const canSubmit = isRenter && (status === "ACCEPTED" || status === "PAYMENT_PENDING");

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Payments</h2>
        {canSubmit && (
          <button className="btn-primary text-sm" onClick={() => setOpen((v) => !v)}>
            {open ? "Cancel" : "Submit payment"}
          </button>
        )}
      </div>

      {open && (
        <form action={action} className="mt-3 grid sm:grid-cols-2 gap-2 border-t border-gray-100 pt-3">
          <input type="hidden" name="bookingId" value={bookingId} />
          <div>
            <label className="label">Amount (৳)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              name="amount"
              defaultValue={totalDue}
              required
              className="input"
            />
          </div>
          <div>
            <label className="label">Type</label>
            <select name="type" className="input" defaultValue="RENTAL_FEE">
              <option value="RENTAL_FEE">Rental fee</option>
              <option value="SERVICE_FEE">Service fee</option>
              <option value="DEPOSIT">Deposit</option>
              <option value="DELIVERY_FEE">Delivery fee</option>
              <option value="DAMAGE_FEE">Damage fee</option>
              <option value="LATE_FEE">Late fee</option>
            </select>
          </div>
          <div>
            <label className="label">Method</label>
            <select name="method" className="input" defaultValue="BKASH">
              <option value="BKASH">bKash</option>
              <option value="NAGAD">Nagad</option>
              <option value="ROCKET">Rocket</option>
              <option value="BANK_TRANSFER">Bank transfer</option>
              <option value="CASH">Cash</option>
              <option value="CARD">Card</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div>
            <label className="label">Transaction ID</label>
            <input name="transactionId" className="input" placeholder="TXN12345" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Proof image URL (optional)</label>
            <input
              type="url"
              name="proofImageUrl"
              className="input"
              placeholder="https://..."
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Note (optional)</label>
            <input name="note" className="input" />
          </div>
          {!state.ok && state.error && (
            <div className="sm:col-span-2">
              <FormError message={state.error} />
            </div>
          )}
          <div className="sm:col-span-2 flex justify-end">
            <SubmitButton>Submit payment</SubmitButton>
          </div>
        </form>
      )}

      <div className="mt-3 space-y-2">
        {payments.length === 0 ? (
          <p className="text-sm text-gray-500">No payments yet.</p>
        ) : (
          payments.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2"
            >
              <div>
                <div className="text-sm font-medium">
                  {formatBDT(p.amount)} · {p.method.replace(/_/g, " ").toLowerCase()} · {p.type.replace(/_/g, " ").toLowerCase()}
                </div>
                <div className="text-xs text-gray-500">
                  {formatDateTime(p.createdAt)}
                  {p.transactionId && <> · TXN {p.transactionId}</>}
                </div>
              </div>
              <StatusBadge status={p.status} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
