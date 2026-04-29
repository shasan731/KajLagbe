"use server";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { messageSchema } from "@/lib/validators/message";
import { fail, flattenZodError, ok, type ActionResult } from "@/lib/actions";
import { createNotification } from "@/lib/services/notification-service";

function form(fd: FormData): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of fd.entries()) if (typeof v === "string") out[k] = v;
  return out;
}

export async function sendMessageAction(_prev: unknown, fd: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = messageSchema.safeParse(form(fd));
  if (!parsed.success) return fail("Invalid message.", flattenZodError(parsed.error));
  const booking = await prisma.booking.findUnique({ where: { id: parsed.data.bookingId } });
  if (!booking) return fail("Booking not found.");
  const isParty = booking.renterId === user.id || booking.ownerId === user.id;
  if (!isParty && user.role !== "ADMIN") return fail("Not authorized.");
  const receiverId = booking.renterId === user.id ? booking.ownerId : booking.renterId;
  await prisma.message.create({
    data: {
      bookingId: booking.id,
      senderId: user.id,
      receiverId,
      message: parsed.data.message,
      attachmentUrl: parsed.data.attachmentUrl ?? null,
    },
  });
  await createNotification(receiverId, "MESSAGE", "New message", parsed.data.message.slice(0, 80), booking.id);
  revalidatePath(`/dashboard/messages/${booking.id}`);
  revalidatePath(`/dashboard/bookings/${booking.id}`);
  return ok();
}
