import Link from "next/link";
import { AppLogo } from "@/components/shared/app-logo";
import { getCurrentUser } from "@/lib/auth";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Menu, Search } from "lucide-react";

export async function MainNav() {
  const user = await getCurrentUser();
  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white md:bg-white/80 md:backdrop-blur">
      <div className="container-app flex h-14 items-center gap-3">
        <AppLogo />
        <nav className="hidden md:flex items-center gap-1 text-sm">
          <Link href="/listings" className="px-3 py-1.5 rounded hover:bg-gray-100 text-gray-700">
            Browse
          </Link>
          <Link href="/categories" className="px-3 py-1.5 rounded hover:bg-gray-100 text-gray-700">
            Categories
          </Link>
          <Link href="/safety" className="px-3 py-1.5 rounded hover:bg-gray-100 text-gray-700">
            Safety
          </Link>
        </nav>
        <form action="/listings" className="ml-auto hidden md:flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              name="q"
              placeholder="Search tools or skills…"
              className="input w-64 pl-8"
            />
          </div>
        </form>
        <details className="relative ml-auto md:hidden">
          <summary className="grid h-10 w-10 cursor-pointer list-none place-items-center rounded-lg hover:bg-gray-100 [&::-webkit-details-marker]:hidden">
            <Menu size={21} />
            <span className="sr-only">Open menu</span>
          </summary>
          <div className="absolute right-0 top-12 w-72 rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
            <form action="/listings" className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input name="q" placeholder="Search tools or skills..." className="input pl-8" />
            </form>
            <nav className="mt-3 grid gap-1 text-sm">
              <Link href="/listings" className="rounded px-3 py-2 hover:bg-gray-100 text-gray-700">
                Browse
              </Link>
              <Link href="/categories" className="rounded px-3 py-2 hover:bg-gray-100 text-gray-700">
                Categories
              </Link>
              <Link href="/safety" className="rounded px-3 py-2 hover:bg-gray-100 text-gray-700">
                Safety
              </Link>
            </nav>
          </div>
        </details>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              {user.role !== "CUSTOMER" && (
                <Link
                  href={user.role === "ADMIN" ? "/admin" : "/provider"}
                  className="btn-ghost text-sm"
                >
                  {user.role === "ADMIN" ? "Admin" : "Provider"}
                </Link>
              )}
              <Link href="/dashboard" className="flex items-center gap-2 rounded-full px-2 py-1 hover:bg-gray-100">
                <UserAvatar name={user.name} size={28} />
                <span className="hidden sm:inline text-sm font-medium text-gray-800">
                  {user.name}
                </span>
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-ghost text-sm">
                Log in
              </Link>
              <Link href="/register" className="btn-primary text-sm">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
