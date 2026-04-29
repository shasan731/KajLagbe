import { ListingCard } from "./listing-card";
import type { Listing, ListingImage, Category } from "@prisma/client";

type CardListing = Listing & { category: Category; images: ListingImage[] };

export function ListingGrid({ listings }: { listings: CardListing[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {listings.map((l) => (
        <ListingCard key={l.id} listing={l} />
      ))}
    </div>
  );
}
