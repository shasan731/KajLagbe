import Link from "next/link";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white mt-12">
      <div className="container-app py-8 grid gap-6 md:grid-cols-4 text-sm">
        <div>
          <div className="font-bold text-gray-900">{APP_NAME}</div>
          <p className="text-gray-600 mt-1">{APP_TAGLINE}</p>
        </div>
        <div>
          <div className="font-semibold text-gray-900 mb-2">Marketplace</div>
          <ul className="space-y-1 text-gray-600">
            <li>
              <Link href="/listings">Browse listings</Link>
            </li>
            <li>
              <Link href="/categories">Categories</Link>
            </li>
            <li>
              <Link href="/register">Become a provider</Link>
            </li>
          </ul>
        </div>
        <div>
          <div className="font-semibold text-gray-900 mb-2">Company</div>
          <ul className="space-y-1 text-gray-600">
            <li>
              <Link href="/about">About</Link>
            </li>
            <li>
              <Link href="/safety">Safety</Link>
            </li>
            <li>
              <Link href="/terms">Terms</Link>
            </li>
            <li>
              <Link href="/privacy">Privacy</Link>
            </li>
          </ul>
        </div>
        <div>
          <div className="font-semibold text-gray-900 mb-2">Get the app</div>
          <p className="text-gray-600">Install KajLagbe as a PWA from your browser menu.</p>
        </div>
      </div>
      <div className="border-t border-gray-200 py-4 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} {APP_NAME}. Built for Bangladesh.
      </div>
    </footer>
  );
}
