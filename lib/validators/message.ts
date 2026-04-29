import { z } from "zod";

export const messageSchema = z.object({
  bookingId: z.string().min(1),
  message: z.string().trim().min(1).max(2000),
  attachmentUrl: z
    .string()
    .url()
    .optional()
    .or(z.literal("").transform(() => undefined)),
});
