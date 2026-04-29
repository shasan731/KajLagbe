import { notFound } from "next/navigation";
import Link from "next/link";
import { MapPin, Shield, Tag, Wallet, AlertTriangle } from "lucide-react";
import { getListingBySlug } from "@/lib/services/listing-service";
import { prisma } from "@/lib/db";
import { PriceDisplay } from "@/components/shared/price-display";
import { RatingStars } from "@/components/shared/rating-stars";
import { UserAvatar } from "@/components/shared/user-avatar";
import { formatBDT } from "@/lib/money";
import { getCurrentUser } from "@/lib/auth";
import { BookingForm } from "./booking-form";
import { FavoriteButton } from "./favorite-button";

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props) {
  const listing = await getListingBySlug(params.slug);
  if (!listing) return {};
  return {
    title: listing.title,
    description: listing.description.slice(0, 160),
  };
}

export default async function ListingDetailPage({ params }: Props) {
  const listing = await getListingBySlug(params.slug);
  if (!listing) notFound();
  if (listing.status !== "ACTIVE") {
    return (
      <div className="container-app py-12">
        <div className="card p-8 text-center">
          <AlertTriangle className="mx-auto text-amber-500" size={28} />
          <h1 className="mt-2 text-lg font-semibold">This listing is not currently available.</h1>
          <Link href="/listings" className="btn-primary mt-4">
            Browse other listings
          </Link>
        </div>
      </div>
    );
  }

  await prisma.listing.update({
    where: { id: listing.id },
    data: { viewCount: { increment: 1 } },
  });

  const user = await getCurrentUser();
  const isOwn = user?.id === listing.ownerId;
  const isFavorited = user
    ? Boolean(
        await prisma.favorite.findUnique({
          where: { userId_listingId: { userId: user.id, listingId: listing.id } },
        })
      )
    : false;

  const reviews = await prisma.review.findMany({
    where: { listingId: listing.id },
    orderBy: { createdAt: "desc" },
    take: 6,
    include: { reviewer: { select: { name: true } } },
  });

  return (
    <div className="container-app py-6 grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {listing.images.length > 0 ? (
            listing.images.map((img) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={img.id}
                src={img.url}
                alt={img.alt ?? listing.title}
                className="w-full aspect-[4/3] object-cover rounded-xl border border-gray-200"
              />
            ))
          ) : (
            <div className="card aspect-[4/3] grid place-items-center text-gray-400 text-sm">
              No images
            </div>
          )}
        </div>
        <div className="card p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs uppercase text-brand-700 font-medium">
                {listing.category.name}
              </div>
              <h1 className="text-2xl font-bold text-gray-900">{listing.title}</h1>
              <div className="mt-1 flex items-center gap-3 text-sm text-gray-600">
                <span className="inline-flex items-center gap-1">
                  <MapPin size={14} /> {listing.locationArea}, {listing.city}
                </span>
                {Number(listing.totalReviews) > 0 && (
                  <RatingStars rating={listing.averageRating} count={listing.totalReviews} />
                )}
              </div>
            </div>
            {user && !isOwn && (
              <FavoriteButton listingId={listing.id} initial={isFavorited} />
            )}
          </div>

          <p className="mt-4 text-gray-700 whitespace-pre-line leading-relaxed">
            {listing.description}
          </p>

          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            <Detail icon={<Tag size={14} />} label="Type" value={listing.listingType.replace(/_/g, " ")} />
            <Detail icon={<Wallet size={14} />} label="Price type" value={listing.priceType} />
            {Number(listing.depositAmount) > 0 && (
              <Detail
                icon={<Shield size={14} />}
                label="Deposit"
                value={formatBDT(listing.depositAmount)}
              />
            )}
            {listing.brand && <Detail label="Brand" value={listing.brand} />}
            {listing.model && <Detail label="Model" value={listing.model} />}
            {listing.condition && <Detail label="Condition" value={listing.condition} />}
          </div>
          {listing.includedItems && (
            <Section title="What's included">{listing.includedItems}</Section>
          )}
          {listing.notIncludedItems && (
            <Section title="Not included">{listing.notIncludedItems}</Section>
          )}
          {listing.safetyInstructions && (
            <Section title="Safety instructions">{listing.safetyInstructions}</Section>
          )}
          {listing.cancellationPolicy && (
            <Section title="Cancellation policy">{listing.cancellationPolicy}</Section>
          )}
        </div>

        <div className="card p-5">
          <h2 className="text-lg font-semibold mb-3">Reviews</h2>
          {reviews.length === 0 ? (
            <p className="text-sm text-gray-500">No reviews yet.</p>
          ) : (
            <ul className="space-y-3">
              {reviews.map((r) => (
                <li key={r.id} className="border-b border-gray-100 last:border-0 pb-3">
                  <div className="flex items-center gap-2">
                    <UserAvatar name={r.reviewer.name} size={28} />
                    <span className="text-sm font-medium">{r.reviewer.name}</span>
                    <RatingStars rating={r.rating} />
                  </div>
                  {r.comment && (
                    <p className="mt-1 text-sm text-gray-700">{r.comment}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <aside className="space-y-4">
        <div className="card p-5 sticky top-20">
          <PriceDisplay amount={listing.basePrice} priceType={listing.priceType} size="lg" />
          <div className="mt-3 flex items-center gap-2">
            <UserAvatar name={listing.owner.name} url={listing.owner.profile?.avatarUrl} />
            <div>
              <div className="text-sm font-medium">{listing.owner.name}</div>
              {Number(listing.owner.totalReviews) > 0 && (
                <RatingStars
                  rating={listing.owner.averageRating}
                  count={listing.owner.totalReviews}
                />
              )}
            </div>
          </div>

          {!user ? (
            <Link href={`/login?next=/listings/${listing.slug}`} className="btn-primary w-full mt-4">
              Log in to book
            </Link>
          ) : isOwn ? (
            <p className="mt-4 text-sm text-gray-500">This is your own listing.</p>
          ) : (
            <BookingForm
              listingId={listing.id}
              listingType={listing.listingType}
              priceType={listing.priceType}
              basePrice={Number(listing.basePrice)}
              depositAmount={Number(listing.depositAmount)}
              commissionPct={Number(listing.commissionPercentage)}
            />
          )}
        </div>
      </aside>
    </div>
  );
}

function Detail({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div>
      <div className="text-xs text-gray-500 inline-flex items-center gap-1">
        {icon} {label}
      </div>
      <div className="font-medium text-gray-900 capitalize">{value.toLowerCase()}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <h3 className="font-semibold text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-700 whitespace-pre-line">{children}</p>
    </div>
  );
}
