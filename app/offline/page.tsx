import Link from "next/link";

export default function OfflinePage() {
  return (
    <main className="container-app grid min-h-[70vh] place-items-center py-10">
      <div className="card max-w-md p-6 text-center">
        <h1 className="text-xl font-semibold text-gray-900">You are offline</h1>
        <p className="mt-2 text-sm text-gray-600">
          KajLagbe needs a connection for fresh listings, bookings, and payments.
        </p>
        <Link href="/" className="btn-primary mt-4">
          Go home
        </Link>
      </div>
    </main>
  );
}
