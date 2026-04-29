import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { MessageThread } from "@/app/dashboard/bookings/[id]/message-thread";

export const dynamic = "force-dynamic";

export default async function MessageBookingPage({
  params,
}: {
  params: { bookingId: string };
}) {
  const user = await requireUser();
  const booking = await prisma.booking.findUnique({
    where: { id: params.bookingId },
    include: {
      listing: { select: { title: true, slug: true } },
      messages: {
        orderBy: { createdAt: "asc" },
        include: { sender: { select: { id: true, name: true } } },
      },
    },
  });
  if (!booking) redirect("/dashboard/messages");
  const isParty = booking.renterId === user.id || booking.ownerId === user.id;
  if (!isParty && user.role !== "ADMIN") redirect("/dashboard/messages");

  // Mark messages as read
  await prisma.message.updateMany({
    where: { bookingId: booking.id, receiverId: user.id, readAt: null },
    data: { readAt: new Date() },
  });

  return (
    <div className="container-app py-6 space-y-4">
      <h1 className="text-xl font-semibold">{booking.listing.title}</h1>
      <MessageThread
        bookingId={booking.id}
        currentUserId={user.id}
        messages={JSON.parse(JSON.stringify(booking.messages))}
      />
    </div>
  );
}
