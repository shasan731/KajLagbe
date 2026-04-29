"use client";
import { useFormState } from "react-dom";
import { loginAction } from "@/app/actions/auth";
import { SubmitButton } from "@/components/forms/submit-button";
import { FormError, FieldError } from "@/components/forms/form-error";

const initial = { ok: false, error: "" } as
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export function LoginForm({ next }: { next?: string }) {
  const [state, action] = useFormState(loginAction, initial);
  const fe = !state.ok ? state.fieldErrors : undefined;
  return (
    <form action={action} className="space-y-3">
      {next && <input type="hidden" name="next" value={next} />}
      <div>
        <label className="label">Phone number</label>
        <input
          name="phone"
          autoComplete="tel"
          inputMode="tel"
          placeholder="017XXXXXXXX"
          required
          className="input"
        />
        <FieldError messages={fe?.phone} />
      </div>
      <div>
        <label className="label">Password</label>
        <input
          type="password"
          name="password"
          required
          autoComplete="current-password"
          className="input"
        />
        <FieldError messages={fe?.password} />
      </div>
      {!state.ok && state.error && <FormError message={state.error} />}
      <SubmitButton className="w-full">Log in</SubmitButton>
    </form>
  );
}
