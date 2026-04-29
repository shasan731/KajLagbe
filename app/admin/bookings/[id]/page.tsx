import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminBookingDetail({ params }: { params: { id: string } }) {
  await requireAdmin();
  redirect(`/dashboard/bookings/${params.id}`);
}
