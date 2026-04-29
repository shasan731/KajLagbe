import { z } from "zod";

export const disputeSchema = z.object({
  bookingId: z.string().min(1),
  type: z.enum([
    "ITEM_DAMAGED",
    "ITEM_NOT_RETURNED",
    "FAKE_LISTING",
    "SERVICE_INCOMPLETE",
    "PROVIDER_NO_SHOW",
    "CUSTOMER_NO_SHOW",
    "PAYMENT_ISSUE",
    "DEPOSIT_ISSUE",
    "OTHER",
  ]),
  title: z.string().trim().min(5).max(120),
  description: z.string().trim().min(20).max(2000),
  claimedAmount: z.coerce.number().min(0).optional(),
  evidenceUrls: z.array(z.string().url()).max(8).default([]),
});

export const disputeResolveSchema = z.object({
  disputeId: z.string().min(1),
  decision: z.string().trim().min(5).max(2000),
  refundAmount: z.coerce.number().min(0).optional(),
  deductionAmount: z.coerce.number().min(0).optional(),
});

export type DisputeInput = z.infer<typeof disputeSchema>;
