import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { StatusBadge } from "@/components/shared/status-badge";

export const dynamic = "force-dynamic";

const STATUSES = ["PENDING_REVIEW", "ACTIVE", "REJECTED", "SUSPENDED", "DRAFT", "ARCHIVED"];

export default async function AdminListings({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  await requireAdmin();
  const status = (searchParams.status || "PENDING_REVIEW") as
    | "PENDING_REVIEW"
    | "ACTIVE"
    | "REJECTED"
    | "SUSPENDED"
    | "DRAFT"
    | "ARCHIVED";

  const listings = await prisma.listing.findMany({
    where: { status },
    orderBy: { updatedAt: "desc" },
    include: { owner: { select: { name: true } }, category: true },
    take: 50,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">Listings</h1>
        <div className="flex flex-wrap gap-1 sm:justify-end">
          {STATUSES.map((s) => (
            <Link
              key={s}
              href={`/admin/listings?status=${s}`}
              className={`px-3 py-1 rounded-full text-sm border ${
                s === status
                  ? "bg-brand-50 border-brand-300 text-brand-800"
                  : "border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {s.replace(/_/g, " ").toLowerCase()}
            </Link>
          ))}
        </div>
      </div>

      {listings.length === 0 ? (
        <p className="text-sm text-gray-500">No listings.</p>
      ) : (
        <div className="card divide-y divide-gray-100">
          {listings.map((l) => (
            <Link
              key={l.id}
              href={`/admin/listings/${l.id}`}
              className="flex items-center justify-between p-4 hover:bg-gray-50"
            >
              <div className="min-w-0">
                <div className="font-medium truncate">{l.title}</div>
                <div className="text-xs text-gray-500">
                  by {l.owner.name} · {l.category.name} · {l.locationArea}, {l.city}
                </div>
              </div>
              <StatusBadge status={l.status} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
