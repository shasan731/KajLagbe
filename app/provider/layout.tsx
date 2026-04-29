import { MainNav } from "@/components/layout/main-nav";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Footer } from "@/components/layout/footer";
import Link from "next/link";

export default function ProviderLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <MainNav />
      <div className="border-b border-gray-200 bg-white">
        <div className="container-app flex items-center gap-2 overflow-x-auto py-2 text-sm no-scrollbar">
          <Link href="/provider" className="px-3 py-1 rounded-full hover:bg-gray-100">
            Overview
          </Link>
          <Link href="/provider/listings" className="px-3 py-1 rounded-full hover:bg-gray-100">
            Listings
          </Link>
          <Link href="/provider/bookings" className="px-3 py-1 rounded-full hover:bg-gray-100">
            Bookings
          </Link>
          <Link href="/provider/earnings" className="px-3 py-1 rounded-full hover:bg-gray-100">
            Earnings
          </Link>
          <Link href="/provider/reviews" className="px-3 py-1 rounded-full hover:bg-gray-100">
            Reviews
          </Link>
          <Link href="/provider/availability" className="px-3 py-1 rounded-full hover:bg-gray-100">
            Availability
          </Link>
        </div>
      </div>
      <main className="flex-1 pb-16 md:pb-0">{children}</main>
      <MobileNav />
      <Footer />
    </div>
  );
}
