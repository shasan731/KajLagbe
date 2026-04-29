import { notFound } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { StatusBadge } from "@/components/shared/status-badge";
import { PriceDisplay } from "@/components/shared/price-display";
import { ListingModerationActions } from "./moderation-actions";

export const dynamic = "force-dynamic";

type Props = { params: { id: string } };

export default async function AdminListingDetail({ params }: Props) {
  await requireAdmin();
  const listing = await prisma.listing.findUnique({
    where: { id: params.id },
    include: {
      owner: { select: { id: true, name: true, phone: true, email: true } },
      category: true,
      images: true,
    },
  });
  if (!listing) notFound();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{listing.title}</h1>
          <div className="mt-1 flex items-center gap-2 text-sm text-gray-600">
            <StatusBadge status={listing.status} />
            <span>
              by{" "}
              <Link href={`/admin/users/${listing.owner.id}`} className="text-brand-700 hover:underline">
                {listing.owner.name}
              </Link>
            </span>
          </div>
        </div>
        {listing.status === "ACTIVE" && (
          <Link href={`/listings/${listing.slug}`} className="btn-secondary text-sm">
            View public page
          </Link>
        )}
      </div>

      <div className="card p-5">
        <div className="grid sm:grid-cols-3 gap-3 text-sm">
          <Detail label="Type" value={listing.listingType.replace(/_/g, " ")} />
          <Detail label="Category" value={listing.category.name} />
          <Detail label="Price">
            <PriceDisplay amount={listing.basePrice} priceType={listing.priceType} />
          </Detail>
          <Detail label="Location" value={`${listing.locationArea}, ${listing.city}`} />
          <Detail label="Risk level" value={listing.riskLevel} />
          <Detail label="Replacement value" value={`৳${listing.replacementValue.toString()}`} />
        </div>
        <p className="mt-4 text-sm text-gray-700 whitespace-pre-line">{listing.description}</p>
      </div>

      {listing.images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {listing.images.map((i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i.id}
              src={i.url}
              alt=""
              className="w-full aspect-square object-cover rounded-lg border border-gray-200"
            />
          ))}
        </div>
      )}

      <ListingModerationActions listingId={listing.id} status={listing.status} adminNote={listing.adminNote ?? ""} />
    </div>
  );
}

function Detail({
  label,
  value,
  children,
}: {
  label: string;
  value?: string;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <div className="text-xs text-gray-500">{label}</div>
      <div className="font-medium capitalize">{children ?? value?.toLowerCase()}</div>
    </div>
  );
}
