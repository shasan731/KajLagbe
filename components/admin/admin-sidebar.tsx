"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Users,
  ListTree,
  ClipboardList,
  Calendar,
  AlertTriangle,
  Wallet,
  Settings,
  LayoutDashboard,
  Star,
  ScrollText,
} from "lucide-react";

const items = [
  { href: "/admin", icon: LayoutDashboard, label: "Overview" },
  { href: "/admin/users", icon: Users, label: "Users" },
  { href: "/admin/listings", icon: ClipboardList, label: "Listings" },
  { href: "/admin/categories", icon: ListTree, label: "Categories" },
  { href: "/admin/bookings", icon: Calendar, label: "Bookings" },
  { href: "/admin/disputes", icon: AlertTriangle, label: "Disputes" },
  { href: "/admin/payments", icon: Wallet, label: "Payments" },
  { href: "/admin/reviews", icon: Star, label: "Reviews" },
  { href: "/admin/settings", icon: Settings, label: "Settings" },
  { href: "/admin/audit-logs", icon: ScrollText, label: "Audit logs" },
];

export function AdminSidebar() {
  const path = usePathname();
  return (
    <aside className="hidden md:block w-56 shrink-0">
      <nav className="card p-2 space-y-1 sticky top-20">
        {items.map(({ href, icon: Icon, label }) => {
          const active = path === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                active ? "bg-brand-50 text-brand-800 font-medium" : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export function AdminMobileSections() {
  const path = usePathname();
  return (
    <nav className="md:hidden border-b border-gray-200 bg-white">
      <div className="container-app flex gap-2 overflow-x-auto py-2 text-sm no-scrollbar">
        {items.map(({ href, label }) => {
          const active = path === href || (href !== "/admin" && path.startsWith(href + "/"));
          return (
            <Link
              key={href}
              href={href}
              className={`shrink-0 rounded-full px-3 py-1.5 ${
                active ? "bg-brand-50 text-brand-800 font-medium" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
