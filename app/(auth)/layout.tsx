import { AppLogo } from "@/components/shared/app-logo";
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="border-b border-gray-200 bg-white">
        <div className="container-app h-14 flex items-center justify-between">
          <AppLogo />
          <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">
            Back to home
          </Link>
        </div>
      </header>
      <main className="flex-1 grid place-items-center px-4 py-8">{children}</main>
    </div>
  );
}
