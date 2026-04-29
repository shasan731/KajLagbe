"use client";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  approveListingAction,
  rejectListingAction,
  suspendListingAction,
} from "@/app/actions/listing";

export function ListingModerationActions({
  listingId,
  status,
  adminNote,
}: {
  listingId: string;
  status: string;
  adminNote: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
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
    <div className="card p-5 space-y-3">
      <h2 className="font-semibold">Moderation</h2>
      {adminNote && (
        <p className="text-sm text-gray-700">
          <span className="font-medium">Last admin note:</span> {adminNote}
        </p>
      )}
      <textarea
        rows={2}
        placeholder="Reason / note for action"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className="input"
      />
      <div className="flex flex-wrap gap-2">
        {(status === "PENDING_REVIEW" || status === "REJECTED" || status === "SUSPENDED") && (
          <button
            disabled={pending}
            className="btn-primary"
            onClick={() => run("Listing approved", () => approveListingAction(listingId))}
          >
            Approve
          </button>
        )}
        {status === "PENDING_REVIEW" && (
          <button
            disabled={pending || reason.length < 5}
            className="btn-danger"
            onClick={() => run("Listing rejected", () => rejectListingAction(listingId, reason))}
          >
            Reject
          </button>
        )}
        {status === "ACTIVE" && (
          <button
            disabled={pending || reason.length < 5}
            className="btn-danger"
            onClick={() => run("Listing suspended", () => suspendListingAction(listingId, reason))}
          >
            Suspend
          </button>
        )}
      </div>
      <p className="text-xs text-gray-500">
        Reason is required for reject/suspend (min 5 characters).
      </p>
    </div>
  );
}
