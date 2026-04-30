"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Briefcase,
  Calendar,
  CreditCard,
  Home,
  ListChecks,
  MessageSquare,
  Search,
  ShieldCheck,
  User,
  Users,
} from "lucide-react";

type Role = "CUSTOMER" | "PROVIDER" | "ADMIN";

const customerItems = [
  { href: "/dashboard", icon: Home, label: "Home" },
  { href: "/listings", icon: Search, label: "Search" },
  { href: "/dashboard/bookings", icon: Calendar, label: "Bookings" },
  { href: "/dashboard/messages", icon: MessageSquare, label: "Messages" },
  { href: "/dashboard/profile", icon: User, label: "Profile" },
];

const providerItems = [
  { href: "/provider", icon: Briefcase, label: "Provider" },
  { href: "/provider/listings", icon: ListChecks, label: "Listings" },
  { href: "/provider/bookings", icon: Calendar, label: "Bookings" },
  { href: "/dashboard/messages", icon: MessageSquare, label: "Messages" },
  { href: "/dashboard/profile", icon: User, label: "Profile" },
];

const adminItems = [
  { href: "/admin", icon: ShieldCheck, label: "Admin" },
  { href: "/admin/listings", icon: ListChecks, label: "Listings" },
  { href: "/admin/bookings", icon: Calendar, label: "Bookings" },
  { href: "/admin/payments", icon: CreditCard, label: "Payments" },
  { href: "/admin/users", icon: Users, label: "Users" },
];

function isActive(path: string, href: string) {
  if (href === "/dashboard" || href === "/provider" || href === "/admin") return path === href;
  return path === href || path.startsWith(href + "/");
}

export function MobileNav({ role = "CUSTOMER" }: { role?: Role }) {
  const path = usePathname();
  const items = role === "ADMIN" ? adminItems : role === "PROVIDER" ? providerItems : customerItems;
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
      <ul className="grid grid-cols-5">
        {items.map(({ href, icon: Icon, label }) => {
          const active = isActive(path, href);
          return (
            <li key={href}>
              <Link
                href={href}
                className={`flex flex-col items-center justify-center py-2 text-xs ${
                  active ? "text-brand-700" : "text-gray-500"
                }`}
              >
                <Icon size={20} />
                <span className="mt-0.5">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
