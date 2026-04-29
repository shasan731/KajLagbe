import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen grid place-items-center px-4">
      <div className="text-center">
        <div className="text-6xl font-bold text-brand-700">404</div>
        <p className="mt-2 text-gray-600">We couldn&apos;t find that page.</p>
        <Link href="/" className="btn-primary mt-4 inline-flex">
          Back home
        </Link>
      </div>
    </div>
  );
}
