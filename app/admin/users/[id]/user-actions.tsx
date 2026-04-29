"use client";
import { useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { setUserRoleAction } from "@/app/actions/admin";
import { useFormState } from "react-dom";
import { setUserStatusAction } from "@/app/actions/admin";
import { SubmitButton } from "@/components/forms/submit-button";

export function UserActions({
  userId,
  role,
  status,
}: {
  userId: string;
  role: string;
  status: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [, statusAction] = useFormState<{ ok: boolean; error?: string }, FormData>(
    setUserStatusAction,
    { ok: false, error: "" }
  );

  function changeRole(next: "CUSTOMER" | "PROVIDER" | "ADMIN") {
    if (!confirm(`Change role to ${next}?`)) return;
    start(async () => {
      const r = await setUserRoleAction(userId, next);
      if (r.ok) {
        toast.success("Role updated.");
        router.refresh();
      } else {
        toast.error(r.error || "Failed.");
      }
    });
  }

  return (
    <div className="card p-5 space-y-4">
      <div>
        <h2 className="font-semibold">Role</h2>
        <p className="text-sm text-gray-600">Current: {role}</p>
        <div className="mt-2 flex gap-2">
          {(["CUSTOMER", "PROVIDER", "ADMIN"] as const).map((r) => (
            <button
              key={r}
              disabled={pending || r === role}
              onClick={() => changeRole(r)}
              className={`btn-secondary text-sm ${r === role ? "opacity-50" : ""}`}
            >
              Set {r.toLowerCase()}
            </button>
          ))}
        </div>
      </div>
      <div>
        <h2 className="font-semibold">Status</h2>
        <p className="text-sm text-gray-600 mb-2">Current: {status}</p>
        <form action={statusAction} className="flex gap-2 items-end">
          <input type="hidden" name="userId" value={userId} />
          <select name="status" defaultValue={status} className="input max-w-xs">
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="BANNED">Banned</option>
          </select>
          <SubmitButton variant="secondary">Update status</SubmitButton>
        </form>
      </div>
    </div>
  );
}
