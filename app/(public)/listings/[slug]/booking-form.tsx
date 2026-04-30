"use client";
import { useFormState } from "react-dom";
import { requestBookingAction } from "@/app/actions/booking";
import { SubmitButton } from "@/components/forms/submit-button";
import { FormError, FieldError } from "@/components/forms/form-error";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { calculatePlatformFee, formatBDT } from "@/lib/money";

type BookingFormState =
  | { ok: true; data?: { id: string }; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

const initialState: BookingFormState = { ok: false, error: "" };

export function BookingForm({
  listingId,
  listingType,
  priceType,
  basePrice,
  depositAmount,
  commissionPct,
}: {
  listingId: string;
  listingType: "TOOL_ONLY" | "SKILL_ONLY" | "TOOL_WITH_OPERATOR" | "PACKAGE";
  priceType: "HOURLY" | "DAILY" | "WEEKLY" | "TASK" | "PACKAGE" | "CUSTOM_QUOTE";
  basePrice: number;
  depositAmount: number;
  commissionPct: number;
}) {
  const [state, action] = useFormState(requestBookingAction, initialState);
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const lastHandledState = useRef("");
  const router = useRouter();
  const minDateTime = new Date().toISOString().slice(0, 16);
  const stateId = state.ok ? state.data?.id : undefined;
  const stateError = state.ok ? "" : state.error;

  useEffect(() => {
    const key = state.ok ? `ok:${stateId ?? ""}` : `err:${stateError ?? ""}`;
    if (!key || key === lastHandledState.current) return;
    lastHandledState.current = key;
    if (state.ok) {
      toast.success("Booking requested!");
      router.push(`/dashboard/bookings/${stateId}`);
    } else if (stateError) {
      toast.error(stateError);
    }
  }, [state.ok, stateError, stateId, router]);

  // Estimate
  let units = 1;
  if (startAt && endAt) {
    const ms = new Date(endAt).getTime() - new Date(startAt).getTime();
    if (priceType === "HOURLY") units = Math.max(1, ms / 36e5);
    else if (priceType === "DAILY") units = Math.max(1, Math.ceil(ms / 864e5));
    else if (priceType === "WEEKLY") units = Math.max(1, Math.ceil(ms / 864e5 / 7));
  }
  const estBase = priceType === "CUSTOM_QUOTE" ? 0 : Math.round(basePrice * units * 100) / 100;
  const estPlatform = calculatePlatformFee(estBase, commissionPct);
  const estTotal = estBase + estPlatform + depositAmount;

  const fe = !state.ok ? state.fieldErrors : undefined;
  const requiresEnd = listingType === "TOOL_ONLY";
  const requiresJob = listingType !== "TOOL_ONLY";

  return (
    <form action={action} className="mt-4 space-y-3">
      <input type="hidden" name="listingId" value={listingId} />
      <div>
        <label className="label">Start date / time</label>
        <input
          type="datetime-local"
          name="startAt"
          required
          min={minDateTime}
          value={startAt}
          onChange={(e) => setStartAt(e.target.value)}
          className="input"
        />
        <FieldError messages={fe?.startAt} />
      </div>
      {requiresEnd && (
        <div>
          <label className="label">End date / time</label>
          <input
            type="datetime-local"
            name="endAt"
            required
            min={startAt || minDateTime}
            value={endAt}
            onChange={(e) => setEndAt(e.target.value)}
            className="input"
          />
          <FieldError messages={fe?.endAt} />
        </div>
      )}
      {requiresJob && (
        <div>
          <label className="label">Describe the job</label>
          <textarea
            name="jobDescription"
            rows={3}
            required
            className="input"
            placeholder="e.g. Fix bathroom tap, install ceiling fan in living room"
          />
          <FieldError messages={fe?.jobDescription} />
        </div>
      )}
      <div>
        <label className="label">Note for provider (optional)</label>
        <textarea name="renterNote" rows={2} className="input" />
      </div>

      {priceType !== "CUSTOM_QUOTE" && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm space-y-1">
          <div className="flex justify-between">
            <span>Base fee</span>
            <span>{formatBDT(estBase)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Platform fee ({commissionPct}%)</span>
            <span>{formatBDT(estPlatform)}</span>
          </div>
          {depositAmount > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>Deposit (refundable)</span>
              <span>{formatBDT(depositAmount)}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold pt-1 border-t border-gray-200 mt-1">
            <span>Estimated total</span>
            <span>{formatBDT(estTotal)}</span>
          </div>
        </div>
      )}

      {!state.ok && state.error && state.error !== "" && <FormError message={state.error} />}

      <SubmitButton className="w-full">Request to book</SubmitButton>
      <p className="text-xs text-gray-500 text-center">
        Provider will accept or send a quote. Payment is manual in MVP.
      </p>
    </form>
  );
}
