import { requireAdmin } from "@/lib/auth";
import { adminDashboardStats } from "@/lib/services/admin-service";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import {
  Users,
  ClipboardList,
  Calendar,
  AlertTriangle,
  Wallet,
  CheckCircle2,
  Briefcase,
} from "lucide-react";
import { formatBDT } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  await requireAdmin();
  const stats = await adminDashboardStats();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Admin overview</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <DashboardCard title="Total users" value={stats.totalUsers} href="/admin/users" icon={<Users size={18} />} />
        <DashboardCard title="Active providers" value={stats.totalProviders} icon={<Briefcase size={18} />} />
        <DashboardCard title="Pending listings" value={stats.pendingListings} href="/admin/listings?status=PENDING_REVIEW" icon={<ClipboardList size={18} />} />
        <DashboardCard title="Active bookings" value={stats.activeBookings} href="/admin/bookings" icon={<Calendar size={18} />} />
        <DashboardCard title="Open disputes" value={stats.openDisputes} href="/admin/disputes" icon={<AlertTriangle size={18} />} />
        <DashboardCard title="Pending payments" value={stats.pendingPayments} href="/admin/payments" icon={<Wallet size={18} />} />
        <DashboardCard title="Completed bookings" value={stats.completedBookings} icon={<CheckCircle2 size={18} />} />
        <DashboardCard
          title="Platform commission"
          value={formatBDT(stats.platformCommissionEstimate)}
          hint="Sum of platform fee on completed bookings"
          icon={<Wallet size={18} />}
        />
      </div>
    </div>
  );
}
