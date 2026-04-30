"use client";
import { useFormState } from "react-dom";
import { sendQuoteAction } from "@/app/actions/booking";
import { SubmitButton } from "@/components/forms/submit-button";
import { FormError } from "@/components/forms/form-error";

export function QuoteForm({ bookingId }: { bookingId: string }) {
  const [state, action] = useFormState<{ ok: boolean; error?: string }, FormData>(
    sendQuoteAction,
    { ok: false, error: "" }
  );
  return (
    <form action={action} className="mt-3 space-y-2">
      <input type="hidden" name="bookingId" value={bookingId} />
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div>
          <label className="label">Quote amount (৳)</label>
          <input
            type="number"
            min="1"
            step="0.01"
            name="amount"
            required
            className="input"
          />
        </div>
        <div>
          <label className="label">Note (optional)</label>
          <input name="note" className="input" />
        </div>
      </div>
      {!state.ok && state.error && <FormError message={state.error} />}
      <SubmitButton>Send quote</SubmitButton>
    </form>
  );
}
