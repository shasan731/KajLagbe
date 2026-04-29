import Link from "next/link";
import type { ReactNode } from "react";

export function DashboardCard({
  title,
  value,
  hint,
  href,
  icon,
}: {
  title: string;
  value: ReactNode;
  hint?: string;
  href?: string;
  icon?: ReactNode;
}) {
  const inner = (
    <div className="card p-4 h-full transition hover:shadow-md">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">{title}</div>
        {icon && <div className="text-gray-400">{icon}</div>}
      </div>
      <div className="mt-2 text-2xl font-semibold text-gray-900">{value}</div>
      {hint && <div className="mt-1 text-xs text-gray-500">{hint}</div>}
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}
