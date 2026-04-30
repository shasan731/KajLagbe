import { MainNav } from "@/components/layout/main-nav";
import { AdminMobileSections, AdminSidebar } from "@/components/admin/admin-sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";

export const runtime = "nodejs";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <MainNav />
      <AdminMobileSections />
      <div className="container-app flex-1 py-6 pb-20 md:pb-6 flex gap-6">
        <AdminSidebar />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
      <MobileNav role="ADMIN" />
    </div>
  );
}
