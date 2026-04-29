import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

export function AppLogo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const text = size === "lg" ? "text-2xl" : size === "sm" ? "text-base" : "text-xl";
  const dot = size === "lg" ? "h-9 w-9" : size === "sm" ? "h-6 w-6" : "h-8 w-8";
  return (
    <Link href="/" className="flex items-center gap-2 group">
      <span
        className={`${dot} grid place-items-center rounded-lg bg-brand-600 text-white font-bold shadow-sm group-hover:bg-brand-700`}
      >
        K
      </span>
      <span className={`${text} font-bold tracking-tight text-gray-900`}>
        {APP_NAME}
      </span>
    </Link>
  );
}
