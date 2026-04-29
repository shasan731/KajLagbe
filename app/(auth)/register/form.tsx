"use client";
import { useFormState } from "react-dom";
import { registerAction } from "@/app/actions/auth";
import { SubmitButton } from "@/components/forms/submit-button";
import { FormError, FieldError } from "@/components/forms/form-error";
import { BD_CITIES } from "@/lib/constants";

const initial = { ok: false, error: "" } as
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export function RegisterForm() {
  const [state, action] = useFormState(registerAction, initial);
  const fe = !state.ok ? state.fieldErrors : undefined;
  return (
    <form action={action} className="space-y-3">
      <div>
        <label className="label">Full name</label>
        <input name="name" required className="input" />
        <FieldError messages={fe?.name} />
      </div>
      <div>
        <label className="label">Phone number</label>
        <input
          name="phone"
          required
          inputMode="tel"
          autoComplete="tel"
          placeholder="017XXXXXXXX"
          className="input"
        />
        <FieldError messages={fe?.phone} />
      </div>
      <div>
        <label className="label">Email (optional)</label>
        <input
          type="email"
          name="email"
          autoComplete="email"
          className="input"
        />
        <FieldError messages={fe?.email} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Password</label>
          <input
            type="password"
            name="password"
            autoComplete="new-password"
            required
            className="input"
          />
          <FieldError messages={fe?.password} />
        </div>
        <div>
          <label className="label">Confirm</label>
          <input
            type="password"
            name="confirmPassword"
            autoComplete="new-password"
            required
            className="input"
          />
          <FieldError messages={fe?.confirmPassword} />
        </div>
      </div>
      <div>
        <label className="label">Account type</label>
        <select name="role" className="input" defaultValue="CUSTOMER">
          <option value="CUSTOMER">Customer (rent / hire)</option>
          <option value="PROVIDER">Provider (rent out / offer skills)</option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">City</label>
          <select name="city" className="input" defaultValue="Dhaka">
            {BD_CITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Area</label>
          <input name="area" className="input" placeholder="e.g. Mirpur" />
        </div>
      </div>
      {!state.ok && state.error && <FormError message={state.error} />}
      <SubmitButton className="w-full">Create account</SubmitButton>
    </form>
  );
}
