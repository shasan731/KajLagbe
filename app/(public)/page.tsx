import Link from "next/link";
import { prisma } from "@/lib/db";
import { ListingGrid } from "@/components/listings/listing-grid";
import { ArrowRight, Wrench, Sparkles, Calendar, Shield } from "lucide-react";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [featured, categories] = await Promise.all([
    prisma.listing.findMany({
      where: { status: "ACTIVE" },
      orderBy: [{ averageRating: "desc" }, { createdAt: "desc" }],
      take: 8,
      include: {
        category: true,
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
      },
    }),
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      take: 12,
    }),
  ]);

  return (
    <>
      <section className="bg-gradient-to-b from-brand-50 to-white">
        <div className="container-app py-10 md:py-16 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-gray-900">
              {APP_TAGLINE}
            </h1>
            <p className="mt-4 text-gray-700 text-lg">
              {APP_NAME} connects you with nearby tools and skilled people across Bangladesh. Drill machines, projectors, electricians, cleaners, magicians — book what you need, when you need it.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/listings" className="btn-primary">
                Browse listings <ArrowRight size={16} />
              </Link>
              <Link href="/register" className="btn-secondary">
                Become a provider
              </Link>
            </div>
            <ul className="mt-8 grid grid-cols-2 gap-3 text-sm">
              <li className="flex items-center gap-2 text-gray-700">
                <Wrench size={16} className="text-brand-600" /> Tool rentals
              </li>
              <li className="flex items-center gap-2 text-gray-700">
                <Sparkles size={16} className="text-brand-600" /> Skilled services
              </li>
              <li className="flex items-center gap-2 text-gray-700">
                <Calendar size={16} className="text-brand-600" /> Tool + operator
              </li>
              <li className="flex items-center gap-2 text-gray-700">
                <Shield size={16} className="text-brand-600" /> Verified providers
              </li>
            </ul>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {featured.slice(0, 4).map((l) => (
              <Link
                key={l.id}
                href={`/listings/${l.slug}`}
                className="card overflow-hidden aspect-square"
              >
                {l.images[0]?.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={l.images[0].url}
                    alt={l.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center bg-brand-50 text-brand-800 text-sm p-4 text-center">
                    {l.title}
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="container-app py-10">
        <div className="flex items-end justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Popular categories</h2>
            <p className="text-sm text-gray-600">Find what you need by category.</p>
          </div>
          <Link href="/categories" className="text-sm text-brand-700 hover:underline">
            All categories
          </Link>
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/categories/${c.slug}`}
              className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm hover:bg-gray-50"
            >
              {c.name}
            </Link>
          ))}
        </div>
      </section>

      <section className="container-app pb-12">
        <div className="flex items-end justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Featured listings</h2>
          <Link href="/listings" className="text-sm text-brand-700 hover:underline">
            See all
          </Link>
        </div>
        <ListingGrid listings={featured} />
      </section>
    </>
  );
}
