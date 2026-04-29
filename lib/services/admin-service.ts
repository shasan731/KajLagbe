import "server-only";
import { prisma } from "../db";
import { fail, ok, type ActionResult } from "../actions";
import { categorySchema, userStatusSchema } from "../validators/admin";
import { slugify } from "../slug";

type CurrentUser = { id: string; role: "CUSTOMER" | "PROVIDER" | "ADMIN" };

export async function adminDashboardStats() {
  const [
    totalUsers,
    totalProviders,
    pendingListings,
    activeBookings,
    openDisputes,
    pendingPayments,
    completedBookings,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "PROVIDER" } }),
    prisma.listing.count({ where: { status: "PENDING_REVIEW" } }),
    prisma.booking.count({
      where: {
        status: { in: ["ACCEPTED", "CONFIRMED", "PAYMENT_PENDING", "IN_USE", "STARTED"] },
      },
    }),
    prisma.dispute.count({ where: { status: { in: ["OPEN", "IN_REVIEW"] } } }),
    prisma.payment.count({ where: { status: "SUBMITTED" } }),
    prisma.booking.count({ where: { status: "COMPLETED" } }),
  ]);
  const completedAmounts = await prisma.booking.aggregate({
    where: { status: "COMPLETED" },
    _sum: { platformFee: true },
  });
  return {
    totalUsers,
    totalProviders,
    pendingListings,
    activeBookings,
    openDisputes,
    pendingPayments,
    completedBookings,
    platformCommissionEstimate: completedAmounts._sum.platformFee?.toString() ?? "0",
  };
}

export async function setUserStatus(raw: unknown, adminUser: CurrentUser): Promise<ActionResult> {
  if (adminUser.role !== "ADMIN") return fail("Admin only.");
  const parsed = userStatusSchema.safeParse(raw);
  if (!parsed.success) return fail("Invalid input.");
  await prisma.user.update({
    where: { id: parsed.data.userId },
    data: { status: parsed.data.status },
  });
  return ok();
}

export async function setUserRole(
  userId: string,
  role: "CUSTOMER" | "PROVIDER" | "ADMIN",
  adminUser: CurrentUser
): Promise<ActionResult> {
  if (adminUser.role !== "ADMIN") return fail("Admin only.");
  await prisma.user.update({ where: { id: userId }, data: { role } });
  return ok();
}

export async function createCategory(raw: unknown, adminUser: CurrentUser): Promise<ActionResult> {
  if (adminUser.role !== "ADMIN") return fail("Admin only.");
  const parsed = categorySchema.safeParse(raw);
  if (!parsed.success) return fail("Invalid input.");
  const slug = parsed.data.slug ? slugify(parsed.data.slug) : slugify(parsed.data.name);
  await prisma.category.create({
    data: {
      name: parsed.data.name,
      slug,
      type: parsed.data.type,
      description: parsed.data.description ?? null,
      isRestricted: parsed.data.isRestricted ?? false,
      isBanned: parsed.data.isBanned ?? false,
      isActive: parsed.data.isActive ?? true,
    },
  });
  return ok();
}

export async function updateCategoryStatus(
  categoryId: string,
  isActive: boolean,
  adminUser: CurrentUser
): Promise<ActionResult> {
  if (adminUser.role !== "ADMIN") return fail("Admin only.");
  await prisma.category.update({ where: { id: categoryId }, data: { isActive } });
  return ok();
}
