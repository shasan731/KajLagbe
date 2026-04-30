"use client";
import { Heart } from "lucide-react";
import { useTransition, useState } from "react";
import { toggleFavoriteAction } from "@/app/actions/favorite";

export function FavoriteButton({
  listingId,
  initial,
}: {
  listingId: string;
  initial: boolean;
}) {
  const [favored, setFavored] = useState(initial);
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        start(async () => {
          const res = await toggleFavoriteAction(listingId);
          if (res.ok) setFavored((v) => !v);
        });
      }}
      className={`btn-secondary ${favored ? "text-red-600" : ""}`}
      aria-pressed={favored}
      aria-label={favored ? "Remove from favorites" : "Add to favorites"}
    >
      <Heart size={16} fill={favored ? "currentColor" : "none"} />
      {favored ? "Saved" : "Save"}
    </button>
  );
}
