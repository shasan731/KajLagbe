"use client";
import { useFormState } from "react-dom";
import { useState } from "react";
import { createReviewAction } from "@/app/actions/review";
import { SubmitButton } from "@/components/forms/submit-button";
import { Star } from "lucide-react";

export function ReviewSection({
  bookingId,
  status,
  alreadyReviewed,
}: {
  bookingId: string;
  status: string;
  alreadyReviewed: boolean;
}) {
  const [state, action] = useFormState<{ ok: boolean; error?: string }, FormData>(
    createReviewAction,
    { ok: false, error: "" }
  );
  const [rating, setRating] = useState(5);
  if (status !== "COMPLETED") return null;

  if (alreadyReviewed || state.ok) {
    return (
      <div className="card p-5 text-sm text-gray-700">Thanks for your review.</div>
    );
  }

  return (
    <div className="card p-5">
      <h2 className="font-semibold">Leave a review</h2>
      <form action={action} className="mt-3 space-y-2">
        <input type="hidden" name="bookingId" value={bookingId} />
        <input type="hidden" name="rating" value={rating} />
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              type="button"
              key={n}
              onClick={() => setRating(n)}
              className="text-amber-500"
            >
              <Star size={26} fill={n <= rating ? "currentColor" : "none"} />
            </button>
          ))}
        </div>
        <textarea name="comment" rows={3} className="input" placeholder="Optional comment" />
        {!state.ok && state.error && (
          <p className="text-sm text-red-700">{state.error}</p>
        )}
        <SubmitButton>Post review</SubmitButton>
      </form>
    </div>
  );
}
