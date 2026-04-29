import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ListingGrid } from "@/components/listings/listing-grid";
import { EmptyState } from "@/components/shared/empty-state";

export const dynamic = "force-dynamic";

type Props = { params: { slug: string } };

export default async function CategoryPage({ params }: Props) {
  const category = await prisma.category.findUnique({ where: { slug: params.slug } });
  if (!category) notFound();
  const listings = await prisma.listing.findMany({
    where: { categoryId: category.id, status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
    include: { category: true, images: { take: 1, orderBy: { sortOrder: "asc" } } },
  });

  return (
    <div className="container-app py-6 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">{category.name}</h1>
        {category.description && (
          <p className="text-sm text-gray-600 mt-1">{category.description}</p>
        )}
      </div>
      {listings.length === 0 ? (
        <EmptyState title="No active listings in this category yet." />
      ) : (
        <ListingGrid listings={listings} />
      )}
    </div>
  );
}
