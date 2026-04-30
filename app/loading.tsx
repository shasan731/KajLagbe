export default function Loading() {
  return (
    <main className="container-app py-8">
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="card p-4">
              <div className="aspect-[4/3] animate-pulse rounded bg-gray-200" />
              <div className="mt-4 h-4 w-3/4 animate-pulse rounded bg-gray-200" />
              <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-gray-100" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
