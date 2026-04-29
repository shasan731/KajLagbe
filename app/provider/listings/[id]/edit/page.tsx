import { notFound } from "next/navigation";
import { requireProvider } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ListingForm } from "@/components/listings/listing-form";
import { StatusBadge } from "@/components/shared/status-badge";
import { EditListingClient } from "./edit-actions";
import { updateListingAction } from "@/app/actions/listing";

export const dynamic = "force-dynamic";

type Props = { params: { id: string }; searchParams: { created?: string } };

export default async function EditListingPage({ params, searchParams }: Props) {
  const user = await requireProvider();
  const listing = await prisma.listing.findUnique({
    where: { id: params.id },
    include: { images: { orderBy: { sortOrder: "asc" } } },
  });
  if (!listing) notFound();
  if (listing.ownerId !== user.id && user.role !== "ADMIN") notFound();
  const categories = await prisma.category.findMany({
    where: { isActive: true, isBanned: false },
    orderBy: { name: "asc" },
  });

  const action = updateListingAction.bind(null, listing.id);

  return (
    <div className="container-app py-6 max-w-3xl space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Edit listing</h1>
          <div className="mt-1 flex items-center gap-2">
            <StatusBadge status={listing.status} />
            {listing.adminNote && (
              <span className="text-sm text-red-700">{listing.adminNote}</span>
            )}
          </div>
        </div>
        <EditListingClient
          listingId={listing.id}
          status={listing.status}
        />
      </div>
      {searchParams?.created && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
          Listing created. Submit it for review when ready.
        </div>
      )}
      <ListingForm
        action={action}
        categories={categories}
        defaultValues={{
          title: listing.title,
          description: listing.description,
          listingType: listing.listingType,
          categoryId: listing.categoryId,
          priceType: listing.priceType,
          basePrice: listing.basePrice.toString(),
          depositAmount: listing.depositAmount.toString(),
          replacementValue: listing.replacementValue.toString(),
          riskLevel: listing.riskLevel,
          deliveryAvailable: listing.deliveryAvailable,
          deliveryBaseFee: listing.deliveryBaseFee.toString(),
          deliveryPerKmFee: listing.deliveryPerKmFee.toString(),
          serviceArea: listing.serviceArea ?? "",
          locationArea: listing.locationArea,
          city: listing.city,
          publicLocationNote: listing.publicLocationNote ?? "",
          lateFeeAmount: listing.lateFeeAmount.toString(),
          lateFeeUnit: listing.lateFeeUnit ?? "DAY",
          includedItems: listing.includedItems ?? "",
          notIncludedItems: listing.notIncludedItems ?? "",
          safetyInstructions: listing.safetyInstructions ?? "",
          cancellationPolicy: listing.cancellationPolicy ?? "",
          brand: listing.brand ?? "",
          model: listing.model ?? "",
          condition: listing.condition ?? "",
          imageUrls: listing.images.map((i) => i.url),
        }}
        submitLabel="Save changes"
      />
    </div>
  );
}
