import { z } from "zod";
import { BANNED_KEYWORDS } from "../constants";

const moneyString = z
  .string()
  .or(z.number())
  .transform((v) => Number(v))
  .refine((v) => Number.isFinite(v) && v >= 0, "Must be a non-negative number");

const optionalText = z
  .string()
  .trim()
  .max(2000)
  .optional()
  .or(z.literal("").transform(() => undefined));

function containsBannedKeyword(text: string): boolean {
  const lower = text.toLowerCase();
  return BANNED_KEYWORDS.some((kw) => lower.includes(kw));
}

export const listingSchema = z
  .object({
    title: z.string().trim().min(5, "Title must be at least 5 characters").max(100),
    description: z.string().trim().min(20, "Description must be at least 20 characters").max(2000),
    listingType: z.enum(["TOOL_ONLY", "SKILL_ONLY", "TOOL_WITH_OPERATOR", "PACKAGE"]),
    categoryId: z.string().min(1, "Category is required"),
    priceType: z.enum(["HOURLY", "DAILY", "WEEKLY", "TASK", "PACKAGE", "CUSTOM_QUOTE"]),
    basePrice: moneyString,
    depositAmount: moneyString.optional(),
    replacementValue: moneyString.optional(),
    riskLevel: z.enum(["LOW", "MEDIUM", "HIGH"]).default("LOW"),
    deliveryAvailable: z.boolean().default(false),
    deliveryBaseFee: moneyString.optional(),
    deliveryPerKmFee: moneyString.optional(),
    serviceArea: optionalText,
    locationArea: z.string().trim().min(1, "Location area is required").max(120),
    city: z.string().trim().min(1).max(80).default("Dhaka"),
    exactLocation: optionalText,
    publicLocationNote: optionalText,
    lateFeeAmount: moneyString.optional(),
    lateFeeUnit: z.enum(["HOUR", "DAY"]).optional().or(z.literal("").transform(() => undefined)),
    includedItems: optionalText,
    notIncludedItems: optionalText,
    safetyInstructions: optionalText,
    cancellationPolicy: optionalText,
    brand: optionalText,
    model: optionalText,
    condition: optionalText,
    imageUrls: z.array(z.string().url()).max(8).default([]),
  })
  .superRefine((data, ctx) => {
    if (containsBannedKeyword(`${data.title} ${data.description}`)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["title"],
        message: "This listing contains banned keywords and cannot be published.",
      });
    }
    if (data.listingType === "TOOL_ONLY" && (!data.replacementValue || data.replacementValue <= 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["replacementValue"],
        message: "Replacement value is required for tool-only listings.",
      });
    }
  });

export type ListingInput = z.infer<typeof listingSchema>;
