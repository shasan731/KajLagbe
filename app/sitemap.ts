import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const baseEntries: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, lastModified: new Date() },
    { url: `${baseUrl}/listings`, lastModified: new Date() },
    { url: `${baseUrl}/categories`, lastModified: new Date() },
    { url: `${baseUrl}/about`, lastModified: new Date() },
    { url: `${baseUrl}/safety`, lastModified: new Date() },
  ];

  try {
    const [categories, listings] = await Promise.all([
      prisma.category.findMany({
        where: { isActive: true, isBanned: false },
        select: { slug: true, updatedAt: true },
        take: 100,
        orderBy: { updatedAt: "desc" },
      }),
      prisma.listing.findMany({
        where: { status: "ACTIVE", owner: { status: "ACTIVE" }, category: { isActive: true } },
        select: { slug: true, updatedAt: true },
        take: 300,
        orderBy: { updatedAt: "desc" },
      }),
    ]);

    return [
      ...baseEntries,
      ...categories.map((category) => ({
        url: `${baseUrl}/categories/${category.slug}`,
        lastModified: category.updatedAt,
      })),
      ...listings.map((listing) => ({
        url: `${baseUrl}/listings/${listing.slug}`,
        lastModified: listing.updatedAt,
      })),
    ];
  } catch {
    return baseEntries;
  }
}
