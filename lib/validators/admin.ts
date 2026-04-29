import { z } from "zod";

export const rejectListingSchema = z.object({
  listingId: z.string().min(1),
  reason: z.string().trim().min(5).max(500),
});

export const suspendListingSchema = z.object({
  listingId: z.string().min(1),
  reason: z.string().trim().min(5).max(500),
});

export const categorySchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z.string().trim().min(2).max(80).optional(),
  type: z.enum(["TOOL_ONLY", "SKILL_ONLY", "TOOL_WITH_OPERATOR", "PACKAGE"]).optional(),
  description: z.string().trim().max(500).optional(),
  isRestricted: z.boolean().optional().default(false),
  isBanned: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
});

export const userStatusSchema = z.object({
  userId: z.string().min(1),
  status: z.enum(["ACTIVE", "SUSPENDED", "BANNED"]),
});
