import { z } from "zod";

const dateString = z
  .string()
  .min(1, "Date is required")
  .transform((v) => new Date(v))
  .refine((d) => !Number.isNaN(d.getTime()), "Invalid date");

export const bookingSchema = z
  .object({
    listingId: z.string().min(1, "Listing is required"),
    startAt: dateString,
    endAt: dateString.optional(),
    jobDescription: z.string().trim().max(1000).optional().or(z.literal("").transform(() => undefined)),
    renterNote: z.string().trim().max(1000).optional().or(z.literal("").transform(() => undefined)),
  })
  .superRefine((data, ctx) => {
    const now = new Date();
    if (data.startAt < now) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["startAt"],
        message: "Start date cannot be in the past.",
      });
    }
    if (data.endAt && data.endAt <= data.startAt) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endAt"],
        message: "End date must be after start date.",
      });
    }
  });

export type BookingInput = z.infer<typeof bookingSchema>;

export const quoteSchema = z.object({
  bookingId: z.string().min(1),
  amount: z.coerce.number().positive("Quote amount must be greater than 0").max(1_000_000),
  note: z.string().trim().max(500).optional(),
});

export const cancelSchema = z.object({
  bookingId: z.string().min(1),
  reason: z.string().trim().min(3, "Please provide a reason").max(500),
});

export const handoverSchema = z.object({
  bookingId: z.string().min(1),
  type: z.enum(["PICKUP", "RETURN", "SERVICE_START", "SERVICE_END"]),
  conditionNote: z.string().trim().max(1000).optional(),
  imageUrls: z.array(z.string().url()).max(6).default([]),
});
