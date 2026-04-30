"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="container-app grid min-h-[70vh] place-items-center py-10">
      <div className="card max-w-md p-6 text-center">
        <h1 className="text-xl font-semibold text-gray-900">Something went wrong</h1>
        <p className="mt-2 text-sm text-gray-600">
          If the database is waking up, wait a moment and try again.
        </p>
        <button type="button" className="btn-primary mt-4" onClick={() => reset()}>
          Try again
        </button>
      </div>
    </main>
  );
}
