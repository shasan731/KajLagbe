import Link from "next/link";
import { ListingFilters } from "@/components/listings/listing-filters";
import { ListingGrid } from "@/components/listings/listing-grid";
import { EmptyState } from "@/components/shared/empty-state";
import { getPublicListings } from "@/lib/services/listing-service";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: { [k: string]: string | string[] | undefined };
};

function s(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v;
}

export default async function ListingsPage({ searchParams }: Props) {
  const page = Math.max(1, Number(s(searchParams.page)) || 1);
  const result = await getPublicListings({
    q: s(searchParams.q) || undefined,
    type: (s(searchParams.type) as never) || undefined,
    city: s(searchParams.city) || undefined,
    area: s(searchParams.area) || undefined,
    min: s(searchParams.min) ? Number(s(searchParams.min)) : undefined,
    max: s(searchParams.max) ? Number(s(searchParams.max)) : undefined,
    delivery: s(searchParams.delivery) === "1",
    sort: (s(searchParams.sort) as never) || "newest",
    page,
  });

  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(searchParams)) {
    if (typeof v === "string") params.set(k, v);
  }

  function pageHref(p: number) {
    const q = new URLSearchParams(params);
    q.set("page", String(p));
    return `/listings?${q.toString()}`;
  }

  return (
    <div className="container-app py-6 space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Browse listings</h1>
          <p className="text-sm text-gray-600">
            {result.total} listing{result.total === 1 ? "" : "s"} found
          </p>
        </div>
      </div>
      <ListingFilters />
      {result.items.length === 0 ? (
        <EmptyState
          title="No listings match your filters"
          description="Try removing some filters or searching for something different."
          action={
            <Link href="/listings" className="btn-secondary">
              Reset filters
            </Link>
          }
        />
      ) : (
        <>
          <ListingGrid listings={result.items} />
          {result.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              {result.page > 1 && (
                <Link className="btn-secondary" href={pageHref(result.page - 1)}>
                  Previous
                </Link>
              )}
              <span className="text-sm text-gray-600">
                Page {result.page} / {result.totalPages}
              </span>
              {result.page < result.totalPages && (
                <Link className="btn-secondary" href={pageHref(result.page + 1)}>
                  Next
                </Link>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
