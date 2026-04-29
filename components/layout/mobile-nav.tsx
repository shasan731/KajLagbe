"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Calendar, MessageSquare, User } from "lucide-react";

const items = [
  { href: "/dashboard", icon: Home, label: "Home" },
  { href: "/listings", icon: Search, label: "Search" },
  { href: "/dashboard/bookings", icon: Calendar, label: "Bookings" },
  { href: "/dashboard/messages", icon: MessageSquare, label: "Messages" },
  { href: "/dashboard/profile", icon: User, label: "Profile" },
];

export function MobileNav() {
  const path = usePathname();
  return (
    <nav className="md:hidden sticky bottom-0 z-30 border-t border-gray-200 bg-white">
      <ul className="grid grid-cols-5">
        {items.map(({ href, icon: Icon, label }) => {
          const active = path === href || path.startsWith(href + "/");
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
