"use client";
import { useFormState } from "react-dom";
import { updateProfileAction } from "@/app/actions/profile";
import { SubmitButton } from "@/components/forms/submit-button";
import { FormError } from "@/components/forms/form-error";
import { BD_CITIES } from "@/lib/constants";

type Defaults = {
  name: string;
  email: string;
  bio: string;
  city: string;
  addressArea: string;
  avatarUrl: string;
  role: string;
};

export function ProfileForm({ defaultValues }: { defaultValues: Defaults }) {
  const [state, action] = useFormState<{ ok: boolean; error?: string; message?: string }, FormData>(
    updateProfileAction,
    { ok: false, error: "" }
  );

  return (
    <form action={action} className="space-y-3">
      <div>
        <label className="label">Full name</label>
        <input name="name" required defaultValue={defaultValues.name} className="input" />
      </div>
      <div>
        <label className="label">Email</label>
        <input
          type="email"
          name="email"
          defaultValue={defaultValues.email}
          className="input"
        />
      </div>
      <div>
        <label className="label">Avatar URL</label>
        <input
          type="url"
          name="avatarUrl"
          defaultValue={defaultValues.avatarUrl}
          className="input"
        />
      </div>
      <div>
        <label className="label">Bio</label>
        <textarea
          name="bio"
          rows={3}
          defaultValue={defaultValues.bio}
          className="input"
        />
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="label">City</label>
          <select name="city" defaultValue={defaultValues.city || "Dhaka"} className="input">
            {BD_CITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Area</label>
          <input
            name="addressArea"
            defaultValue={defaultValues.addressArea}
            className="input"
          />
        </div>
      </div>
      <div>
        <label className="label">Account role</label>
        <select name="role" defaultValue={defaultValues.role} className="input">
          <option value="CUSTOMER">Customer</option>
          <option value="PROVIDER">Provider</option>
        </select>
        <p className="text-xs text-gray-500 mt-1">
          Switch to Provider to create listings.
        </p>
      </div>
      {state.ok && state.message && (
        <p className="text-sm text-emerald-700">{state.message}</p>
      )}
      {!state.ok && state.error && <FormError message={state.error} />}
      <SubmitButton>Save profile</SubmitButton>
    </form>
  );
}
