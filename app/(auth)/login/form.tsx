"use client";
import { useFormState } from "react-dom";
import { useState } from "react";
import { loginAction } from "@/app/actions/auth";
import { SubmitButton } from "@/components/forms/submit-button";
import { FormError, FieldError } from "@/components/forms/form-error";
import { Eye, EyeOff } from "lucide-react";

const initial = { ok: false, error: "" } as
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export function LoginForm({ next }: { next?: string }) {
  const [state, action] = useFormState(loginAction, initial);
  const [showPassword, setShowPassword] = useState(false);
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
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            required
            autoComplete="current-password"
            className="input pr-10"
          />
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-500 hover:bg-gray-100"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        <FieldError messages={fe?.password} />
        <p className="mt-1 text-xs text-gray-500">Forgot password? Contact admin support.</p>
      </div>
      {!state.ok && state.error && <FormError message={state.error} />}
      <SubmitButton className="w-full">Log in</SubmitButton>
    </form>
  );
}
