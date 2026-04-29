import { format, formatDistanceToNow, isAfter, isBefore } from "date-fns";

export function formatDate(date: Date | string | null | undefined, fmt = "PP"): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, fmt);
}

export function formatDateTime(date: Date | string | null | undefined): string {
  return formatDate(date, "PP p");
}

export function timeAgo(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}

export function isPast(date: Date | string): boolean {
  const d = typeof date === "string" ? new Date(date) : date;
  return isBefore(d, new Date());
}

export function isFuture(date: Date | string): boolean {
  const d = typeof date === "string" ? new Date(date) : date;
  return isAfter(d, new Date());
}
