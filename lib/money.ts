import { CURRENCY_SYMBOL } from "./constants";

type Numericish = number | string | { toString(): string } | null | undefined;

export function toNumber(value: Numericish): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  const n = Number(value.toString());
  return Number.isFinite(n) ? n : 0;
}

export function formatBDT(amount: Numericish, opts?: { showSymbol?: boolean }): string {
  const n = toNumber(amount);
  const formatted = n.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  if (opts?.showSymbol === false) return formatted;
  return `${CURRENCY_SYMBOL}${formatted}`;
}

export function calculatePlatformFee(baseFee: Numericish, percentage: Numericish): number {
  const base = toNumber(baseFee);
  const pct = toNumber(percentage);
  return Math.round(base * (pct / 100) * 100) / 100;
}

export function calculateTotalAmount(parts: {
  baseFee: Numericish;
  deliveryFee?: Numericish;
  platformFee?: Numericish;
  depositAmount?: Numericish;
  discount?: Numericish;
}): number {
  const total =
    toNumber(parts.baseFee) +
    toNumber(parts.deliveryFee) +
    toNumber(parts.platformFee) +
    toNumber(parts.depositAmount) -
    toNumber(parts.discount);
  return Math.max(0, Math.round(total * 100) / 100);
}

export function suggestedDeposit(replacementValue: Numericish, risk: "LOW" | "MEDIUM" | "HIGH"): number {
  const pct = risk === "LOW" ? 0.1 : risk === "MEDIUM" ? 0.25 : 0.5;
  return Math.round(toNumber(replacementValue) * pct * 100) / 100;
}
