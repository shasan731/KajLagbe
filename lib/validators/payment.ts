import { z } from "zod";

export const paymentSubmitSchema = z.object({
  bookingId: z.string().min(1),
  amount: z.coerce.number().min(0),
  method: z.enum(["CASH", "BKASH", "NAGAD", "ROCKET", "BANK_TRANSFER", "CARD", "OTHER"]),
  type: z.enum([
    "RENTAL_FEE",
    "SERVICE_FEE",
    "DEPOSIT",
    "PLATFORM_FEE",
    "DELIVERY_FEE",
    "REFUND",
    "PAYOUT",
    "DAMAGE_FEE",
    "LATE_FEE",
  ]),
  transactionId: z.string().trim().max(120).optional(),
  proofImageUrl: z
    .string()
    .url()
    .optional()
    .or(z.literal("").transform(() => undefined)),
  note: z.string().trim().max(500).optional(),
});

export type PaymentSubmitInput = z.infer<typeof paymentSubmitSchema>;
