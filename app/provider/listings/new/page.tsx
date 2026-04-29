import { requireProvider } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ListingForm } from "@/components/listings/listing-form";
import { createListingAction } from "@/app/actions/listing";

export const dynamic = "force-dynamic";

export default async function NewListingPage() {
  await requireProvider();
  const categories = await prisma.category.findMany({
    where: { isActive: true, isBanned: false },
    orderBy: { name: "asc" },
  });
  return (
    <div className="container-app py-6 max-w-3xl">
      <h1 className="text-2xl font-semibold mb-1">Create a new listing</h1>
      <p className="text-sm text-gray-600 mb-4">
        Listings start as DRAFT. Submit for review when ready and admin will approve before going live.
      </p>
      <ListingForm action={createListingAction} categories={categories} submitLabel="Create draft" />
    </div>
  );
}
