import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { EmptyState } from "@/components/shared/empty-state";
import { timeAgo } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default async function MessagesIndex() {
  const user = await requireUser();
  const bookings = await prisma.booking.findMany({
    where: { OR: [{ renterId: user.id }, { ownerId: user.id }], messages: { some: {} } },
    orderBy: { updatedAt: "desc" },
    include: {
      listing: { select: { title: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { sender: { select: { name: true } } },
      },
      renter: { select: { id: true, name: true } },
      owner: { select: { id: true, name: true } },
    },
  });

  return (
    <div className="container-app py-6 space-y-4">
      <h1 className="text-2xl font-semibold">Messages</h1>
      {bookings.length === 0 ? (
        <EmptyState title="No conversations yet." description="Messages are tied to bookings." />
      ) : (
        <div className="card divide-y divide-gray-100">
          {bookings.map((b) => {
            const last = b.messages[0];
            const counterpart = b.renterId === user.id ? b.owner : b.renter;
            return (
              <Link
                key={b.id}
                href={`/dashboard/messages/${b.id}`}
                className="flex items-center justify-between p-4 hover:bg-gray-50"
              >
                <div>
                  <div className="font-medium">{counterpart.name} · {b.listing.title}</div>
                  <div className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                    {last && (
                      <>
                        <span className="font-medium">{last.sender.name}:</span> {last.message}
                      </>
                    )}
                  </div>
                </div>
                <div className="text-xs text-gray-400">{last && timeAgo(last.createdAt)}</div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
