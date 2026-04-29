"use client";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function SubmitButton({
  children,
  className,
  variant = "primary",
}: {
  children: React.ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "danger";
}) {
  const { pending } = useFormStatus();
  const cls =
    variant === "secondary"
      ? "btn-secondary"
      : variant === "danger"
        ? "btn-danger"
        : "btn-primary";
  return (
    <button type="submit" disabled={pending} className={cn(cls, className)}>
      {pending && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  );
}
