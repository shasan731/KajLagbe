import { Star } from "lucide-react";

export function RatingStars({
  rating,
  count,
  size = "sm",
}: {
  rating: number | string | { toString(): string } | null | undefined;
  count?: number;
  size?: "xs" | "sm" | "md";
}) {
  const value = Number(rating ?? 0);
  const px = size === "md" ? 18 : size === "sm" ? 14 : 12;
  return (
    <span className="inline-flex items-center gap-1 text-amber-500">
      <Star size={px} fill="currentColor" stroke="none" />
      <span className="text-gray-800 font-medium text-sm">{value.toFixed(1)}</span>
      {typeof count === "number" && (
        <span className="text-gray-500 text-xs">({count})</span>
      )}
    </span>
  );
}
