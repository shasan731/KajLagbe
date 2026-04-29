"use client";
import { useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { archiveListingAction, submitListingAction } from "@/app/actions/listing";

export function EditListingClient({ listingId, status }: { listingId: string; status: string }) {
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
    <div className="flex gap-2">
      {(status === "DRAFT" || status === "REJECTED") && (
        <button
          disabled={pending}
          className="btn-primary text-sm"
          onClick={() => run("Submitted for review.", () => submitListingAction(listingId))}
        >
          Submit for review
        </button>
      )}
      {status !== "ARCHIVED" && (
        <button
          disabled={pending}
          className="btn-ghost text-sm"
          onClick={() => run("Listing archived.", () => archiveListingAction(listingId))}
        >
          Archive
        </button>
      )}
    </div>
  );
}
