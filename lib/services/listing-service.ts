import "server-only";
import { prisma } from "../db";
import { uniqueSlug } from "../slug";
import { listingSchema, type ListingInput } from "../validators/listing";
import { fail, flattenZodError, ok, type ActionResult } from "../actions";
import type { ListingStatus, Prisma } from "@prisma/client";
import { createNotification } from "./notification-service";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "../constants";

type CurrentUser = { id: string; role: "CUSTOMER" | "PROVIDER" | "ADMIN" };

function inputToData(parsed: ListingInput) {
  const {
    imageUrls,
    lateFeeUnit,
    ...rest
  } = parsed;
  return {
    rest,
    imageUrls: imageUrls ?? [],
    lateFeeUnit: lateFeeUnit ?? null,
  };
}

export async function createListing(
  raw: unknown,
  currentUser: CurrentUser
): Promise<ActionResult<{ id: string; slug: string }>> {
  if (currentUser.role !== "PROVIDER" && currentUser.role !== "ADMIN") {
    return fail("Only providers can create listings.");
  }
  const parsed = listingSchema.safeParse(raw);
  if (!parsed.success) {
    return fail("Please correct the errors below.", flattenZodError(parsed.error));
  }
  const { rest, imageUrls, lateFeeUnit } = inputToData(parsed.data);
  const slug = uniqueSlug(rest.title);

  const created = await prisma.listing.create({
    data: {
      ownerId: currentUser.id,
      categoryId: rest.categoryId,
      listingType: rest.listingType,
      status: "DRAFT",
      title: rest.title,
      slug,
      description: rest.description,
      brand: rest.brand ?? null,
      model: rest.model ?? null,
      condition: rest.condition ?? null,
      priceType: rest.priceType,
      basePrice: rest.basePrice,
      depositAmount: rest.depositAmount ?? 0,
      replacementValue: rest.replacementValue ?? 0,
      riskLevel: rest.riskLevel,
      deliveryAvailable: rest.deliveryAvailable,
      deliveryBaseFee: rest.deliveryBaseFee ?? 0,
      deliveryPerKmFee: rest.deliveryPerKmFee ?? 0,
      serviceArea: rest.serviceArea ?? null,
      locationArea: rest.locationArea,
      city: rest.city ?? "Dhaka",
      exactLocation: rest.exactLocation ?? null,
      publicLocationNote: rest.publicLocationNote ?? null,
      lateFeeAmount: rest.lateFeeAmount ?? 0,
      lateFeeUnit,
      includedItems: rest.includedItems ?? null,
      notIncludedItems: rest.notIncludedItems ?? null,
      safetyInstructions: rest.safetyInstructions ?? null,
      cancellationPolicy: rest.cancellationPolicy ?? null,
      images: {
        createMany: {
          data: imageUrls.map((url, i) => ({ url, sortOrder: i })),
        },
      },
    },
    select: { id: true, slug: true },
  });

  return ok(created, "Listing created as draft.");
}

export async function updateListing(
  listingId: string,
  raw: unknown,
  currentUser: CurrentUser
): Promise<ActionResult<{ id: string }>> {
  const existing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!existing) return fail("Listing not found.");
  if (existing.ownerId !== currentUser.id && currentUser.role !== "ADMIN") {
    return fail("Not authorized to edit this listing.");
  }
  const parsed = listingSchema.safeParse(raw);
  if (!parsed.success) {
    return fail("Please correct the errors below.", flattenZodError(parsed.error));
  }
  const { rest, imageUrls, lateFeeUnit } = inputToData(parsed.data);

  await prisma.$transaction([
    prisma.listing.update({
      where: { id: listingId },
      data: {
        categoryId: rest.categoryId,
        listingType: rest.listingType,
        title: rest.title,
        description: rest.description,
        brand: rest.brand ?? null,
        model: rest.model ?? null,
        condition: rest.condition ?? null,
        priceType: rest.priceType,
        basePrice: rest.basePrice,
        depositAmount: rest.depositAmount ?? 0,
        replacementValue: rest.replacementValue ?? 0,
        riskLevel: rest.riskLevel,
        deliveryAvailable: rest.deliveryAvailable,
        deliveryBaseFee: rest.deliveryBaseFee ?? 0,
        deliveryPerKmFee: rest.deliveryPerKmFee ?? 0,
        serviceArea: rest.serviceArea ?? null,
        locationArea: rest.locationArea,
        city: rest.city ?? "Dhaka",
        exactLocation: rest.exactLocation ?? null,
        publicLocationNote: rest.publicLocationNote ?? null,
        lateFeeAmount: rest.lateFeeAmount ?? 0,
        lateFeeUnit,
        includedItems: rest.includedItems ?? null,
        notIncludedItems: rest.notIncludedItems ?? null,
        safetyInstructions: rest.safetyInstructions ?? null,
        cancellationPolicy: rest.cancellationPolicy ?? null,
        // Reviewing again after edit if it was rejected
        status: existing.status === "REJECTED" ? "DRAFT" : existing.status,
      },
    }),
    prisma.listingImage.deleteMany({ where: { listingId } }),
    prisma.listingImage.createMany({
      data: imageUrls.map((url, i) => ({ listingId, url, sortOrder: i })),
    }),
  ]);

  return ok({ id: listingId }, "Listing updated.");
}

export async function submitListingForReview(
  listingId: string,
  currentUser: CurrentUser
): Promise<ActionResult> {
  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) return fail("Listing not found.");
  if (listing.ownerId !== currentUser.id) return fail("Not authorized.");
  if (listing.status !== "DRAFT" && listing.status !== "REJECTED") {
    return fail("Only draft listings can be submitted for review.");
  }
  await prisma.listing.update({
    where: { id: listingId },
    data: { status: "PENDING_REVIEW" },
  });
  return ok(undefined, "Submitted for review.");
}

export async function approveListing(
  listingId: string,
  adminUser: CurrentUser
): Promise<ActionResult> {
  if (adminUser.role !== "ADMIN") return fail("Admin only.");
  const listing = await prisma.listing.update({
    where: { id: listingId },
    data: { status: "ACTIVE", adminNote: null },
  });
  await createNotification(
    listing.ownerId,
    "SYSTEM",
    "Listing approved",
    `Your listing "${listing.title}" is now live.`
  );
  return ok();
}

export async function rejectListing(
  listingId: string,
  reason: string,
  adminUser: CurrentUser
): Promise<ActionResult> {
  if (adminUser.role !== "ADMIN") return fail("Admin only.");
  const listing = await prisma.listing.update({
    where: { id: listingId },
    data: { status: "REJECTED", adminNote: reason },
  });
  await createNotification(
    listing.ownerId,
    "SYSTEM",
    "Listing rejected",
    `Your listing "${listing.title}" was rejected: ${reason}`
  );
  return ok();
}

export async function suspendListing(
  listingId: string,
  reason: string,
  adminUser: CurrentUser
): Promise<ActionResult> {
  if (adminUser.role !== "ADMIN") return fail("Admin only.");
  const listing = await prisma.listing.update({
    where: { id: listingId },
    data: { status: "SUSPENDED", adminNote: reason },
  });
  await createNotification(
    listing.ownerId,
    "SYSTEM",
    "Listing suspended",
    `Your listing "${listing.title}" was suspended: ${reason}`
  );
  return ok();
}

export async function archiveListing(listingId: string, currentUser: CurrentUser): Promise<ActionResult> {
  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) return fail("Listing not found.");
  if (listing.ownerId !== currentUser.id && currentUser.role !== "ADMIN") {
    return fail("Not authorized.");
  }
  await prisma.listing.update({ where: { id: listingId }, data: { status: "ARCHIVED" } });
  return ok();
}

export type PublicListingFilters = {
  q?: string;
  type?: "TOOL_ONLY" | "SKILL_ONLY" | "TOOL_WITH_OPERATOR" | "PACKAGE";
  city?: string;
  area?: string;
  categoryId?: string;
  categorySlug?: string;
  min?: number;
  max?: number;
  delivery?: boolean;
  sort?: "newest" | "rating" | "price_asc" | "price_desc";
  page?: number;
  pageSize?: number;
};

export async function getPublicListings(filters: PublicListingFilters) {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, filters.pageSize ?? DEFAULT_PAGE_SIZE));

  const where: Prisma.ListingWhereInput = {
    status: "ACTIVE" satisfies ListingStatus,
  };

  if (filters.q) {
    where.OR = [
      { title: { contains: filters.q, mode: "insensitive" } },
      { description: { contains: filters.q, mode: "insensitive" } },
    ];
  }
  if (filters.type) where.listingType = filters.type;
  if (filters.city) where.city = { equals: filters.city, mode: "insensitive" };
  if (filters.area) where.locationArea = { contains: filters.area, mode: "insensitive" };
  if (filters.categoryId) where.categoryId = filters.categoryId;
  if (filters.categorySlug) where.category = { slug: filters.categorySlug };
  if (filters.min !== undefined) where.basePrice = { ...(where.basePrice as object), gte: filters.min };
  if (filters.max !== undefined) where.basePrice = { ...(where.basePrice as object), lte: filters.max };
  if (filters.delivery) where.deliveryAvailable = true;

  const orderBy: Prisma.ListingOrderByWithRelationInput =
    filters.sort === "rating"
      ? { averageRating: "desc" }
      : filters.sort === "price_asc"
        ? { basePrice: "asc" }
        : filters.sort === "price_desc"
          ? { basePrice: "desc" }
          : { createdAt: "desc" };

  const [items, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        category: true,
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
        owner: { select: { id: true, name: true, averageRating: true, totalReviews: true } },
      },
    }),
    prisma.listing.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getListingBySlug(slug: string) {
  return prisma.listing.findUnique({
    where: { slug },
    include: {
      category: true,
      images: { orderBy: { sortOrder: "asc" } },
      owner: {
        select: {
          id: true,
          name: true,
          averageRating: true,
          totalReviews: true,
          createdAt: true,
          profile: { select: { avatarUrl: true, addressArea: true, city: true, bio: true } },
        },
      },
    },
  });
}

export async function incrementViewCount(listingId: string) {
  return prisma.listing.update({
    where: { id: listingId },
    data: { viewCount: { increment: 1 } },
  });
}

export async function getProviderListings(providerId: string) {
  return prisma.listing.findMany({
    where: { ownerId: providerId },
    orderBy: { updatedAt: "desc" },
    include: {
      category: true,
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
      _count: { select: { bookings: true } },
    },
  });
}
