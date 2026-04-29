export const metadata = { title: "Availability" };

export default function AvailabilityPage() {
  return (
    <div className="container-app py-6 space-y-4 max-w-2xl">
      <h1 className="text-2xl font-semibold">Availability</h1>
      <div className="card p-5 text-sm text-gray-700 space-y-2">
        <p>
          Per-listing availability slots and blocked dates are part of the schema and can be edited via Prisma Studio in MVP. A UI is planned for the next release.
        </p>
        <p>
          For now, customers can book any future date and providers manually accept or reject conflicting requests.
        </p>
      </div>
    </div>
  );
}
