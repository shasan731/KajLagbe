import Link from "next/link";
import { MapPin } from "lucide-react";
import { PriceDisplay } from "@/components/shared/price-display";
import { RatingStars } from "@/components/shared/rating-stars";
import type { Listing, ListingImage, Category } from "@prisma/client";

type CardListing = Listing & {
  category: Category;
  images: ListingImage[];
};

export function ListingCard({ listing }: { listing: CardListing }) {
  const cover = listing.images[0]?.url;
  return (
    <Link
      href={`/listings/${listing.slug}`}
      className="card group overflow-hidden transition hover:shadow-md"
    >
      <div className="aspect-[4/3] w-full bg-gray-100 overflow-hidden">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt={listing.title}
            className="h-full w-full object-cover transition group-hover:scale-[1.02]"
            loading="lazy"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-xs uppercase tracking-wide text-gray-400">
            {listing.category.name}
          </div>
        )}
      </div>
      <div className="p-3">
        <div className="text-xs uppercase text-gray-500 mb-0.5">
          {listing.category.name}
        </div>
        <h3 className="font-semibold text-gray-900 line-clamp-2 leading-snug">
          {listing.title}
        </h3>
        <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
          <MapPin size={12} />
          <span className="truncate">
            {listing.locationArea}, {listing.city}
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <PriceDisplay amount={listing.basePrice} priceType={listing.priceType} />
          {Number(listing.totalReviews) > 0 ? (
            <RatingStars rating={listing.averageRating} count={listing.totalReviews} />
          ) : (
            <span className="text-xs text-gray-400">No reviews yet</span>
          )}
        </div>
      </div>
    </Link>
  );
}
