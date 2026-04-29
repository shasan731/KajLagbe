"use client";
import { useFormState } from "react-dom";
import { useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createCategoryAction, updateCategoryStatusAction } from "@/app/actions/admin";
import { SubmitButton } from "@/components/forms/submit-button";
import { FormError } from "@/components/forms/form-error";

export function NewCategoryForm() {
  const [state, action] = useFormState<{ ok: boolean; error?: string }, FormData>(
    createCategoryAction,
    { ok: false, error: "" }
  );
  return (
    <form action={action} className="card p-4 grid sm:grid-cols-12 gap-2">
      <div className="sm:col-span-3">
        <label className="label">Name</label>
        <input name="name" required className="input" />
      </div>
      <div className="sm:col-span-3">
        <label className="label">Slug (optional)</label>
        <input name="slug" className="input" />
      </div>
      <div className="sm:col-span-3">
        <label className="label">Type</label>
        <select name="type" className="input" defaultValue="">
          <option value="">Any</option>
          <option value="TOOL_ONLY">Tool only</option>
          <option value="SKILL_ONLY">Skill only</option>
          <option value="TOOL_WITH_OPERATOR">Tool + operator</option>
          <option value="PACKAGE">Package</option>
        </select>
      </div>
      <div className="sm:col-span-3 flex flex-col gap-1 justify-end">
        <label className="inline-flex items-center gap-1 text-sm">
          <input type="checkbox" name="isActive" defaultChecked /> Active
        </label>
        <label className="inline-flex items-center gap-1 text-sm">
          <input type="checkbox" name="isRestricted" /> Restricted
        </label>
        <label className="inline-flex items-center gap-1 text-sm">
          <input type="checkbox" name="isBanned" /> Banned
        </label>
      </div>
      <div className="sm:col-span-12 flex justify-end gap-2 items-center">
        {!state.ok && state.error && <FormError message={state.error} />}
        <SubmitButton>Add category</SubmitButton>
      </div>
    </form>
  );
}

export function ToggleClient({ id, isActive }: { id: string; isActive: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      disabled={pending}
      className="btn-secondary text-xs"
      onClick={() => {
        start(async () => {
          const r = await updateCategoryStatusAction(id, !isActive);
          if (r.ok) {
            toast.success(isActive ? "Deactivated." : "Activated.");
            router.refresh();
          } else {
            toast.error(r.error || "Failed.");
          }
        });
      }}
    >
      {isActive ? "Deactivate" : "Activate"}
    </button>
  );
}
