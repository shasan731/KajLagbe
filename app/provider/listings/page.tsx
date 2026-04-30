import Link from "next/link";
import { requireProvider } from "@/lib/auth";
import { getProviderListings } from "@/lib/services/listing-service";
import { StatusBadge } from "@/components/shared/status-badge";
import { PriceDisplay } from "@/components/shared/price-display";
import { EmptyState } from "@/components/shared/empty-state";

export const dynamic = "force-dynamic";

export default async function ProviderListingsPage() {
  const user = await requireProvider();
  const listings = await getProviderListings(user.id);

  return (
    <div className="container-app py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My listings</h1>
        <Link href="/provider/listings/new" className="btn-primary">
          + New listing
        </Link>
      </div>
      {listings.length === 0 ? (
        <EmptyState
          title="No listings yet."
          description="Create your first listing to start earning."
          action={
            <Link href="/provider/listings/new" className="btn-primary">
              Create listing
            </Link>
          }
        />
      ) : (
        <div className="card divide-y divide-gray-100">
          {listings.map((l) => (
            <div key={l.id} className="flex items-center gap-4 p-3">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                {l.images[0]?.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={l.images[0].url}
                    alt=""
                    width={64}
                    height={64}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover"
                  />
                ) : null}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/provider/listings/${l.id}/edit`}
                    className="font-medium hover:underline"
                  >
                    {l.title}
                  </Link>
                  <StatusBadge status={l.status} />
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {l.category.name} · {l.locationArea}, {l.city} · {l._count.bookings} bookings
                </div>
              </div>
              <div className="text-right">
                <PriceDisplay amount={l.basePrice} priceType={l.priceType} />
                <div className="mt-1 flex justify-end gap-2">
                  <Link
                    href={`/provider/listings/${l.id}/edit`}
                    className="btn-ghost text-xs"
                  >
                    Edit
                  </Link>
                  {l.status === "ACTIVE" && (
                    <Link
                      href={`/listings/${l.slug}`}
                      className="btn-ghost text-xs"
                    >
                      View
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
