import { redirect, notFound } from "next/navigation";
import { requireProvider } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

type Props = { params: { id: string } };

export default async function ProviderBookingDetail({ params }: Props) {
  const user = await requireProvider();
  const booking = await prisma.booking.findUnique({
    where: { id: params.id },
    select: { id: true, ownerId: true },
  });
  if (!booking) notFound();
  if (booking.ownerId !== user.id && user.role !== "ADMIN") notFound();
  redirect(`/dashboard/bookings/${params.id}`);
}
