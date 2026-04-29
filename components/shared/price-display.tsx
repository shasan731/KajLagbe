import { formatBDT } from "@/lib/money";
import type { PriceType } from "@prisma/client";

const SUFFIX: Record<PriceType, string> = {
  HOURLY: "/hour",
  DAILY: "/day",
  WEEKLY: "/week",
  TASK: "/task",
  PACKAGE: "/package",
  CUSTOM_QUOTE: " — quote",
};

export function PriceDisplay({
  amount,
  priceType,
  size = "md",
}: {
  amount: number | string | { toString(): string } | null | undefined;
  priceType?: PriceType;
  size?: "sm" | "md" | "lg";
}) {
  const sz = size === "lg" ? "text-2xl" : size === "sm" ? "text-sm" : "text-lg";
  if (priceType === "CUSTOM_QUOTE" && (!amount || Number(amount) === 0)) {
    return <span className={`${sz} font-semibold text-gray-700`}>Custom quote</span>;
  }
  return (
    <span className={`${sz} font-semibold text-gray-900`}>
      {formatBDT(amount)}
      {priceType && <span className="text-xs font-normal text-gray-500">{SUFFIX[priceType]}</span>}
    </span>
  );
}
