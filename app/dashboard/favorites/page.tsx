import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ListingGrid } from "@/components/listings/listing-grid";
import { EmptyState } from "@/components/shared/empty-state";

export const dynamic = "force-dynamic";

export default async function FavoritesPage() {
  const user = await requireUser();
  const favorites = await prisma.favorite.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      listing: {
        include: {
          category: true,
          images: { take: 1, orderBy: { sortOrder: "asc" } },
        },
      },
    },
  });

  const listings = favorites.map((f) => f.listing);

  return (
    <div className="container-app py-6 space-y-4">
      <h1 className="text-2xl font-semibold">Favorites</h1>
      {listings.length === 0 ? (
        <EmptyState
          title="No saved listings yet."
          description="Tap the heart on any listing to save it for later."
          action={
            <Link href="/listings" className="btn-primary">
              Browse listings
            </Link>
          }
        />
      ) : (
        <ListingGrid listings={listings} />
      )}
    </div>
  );
}
