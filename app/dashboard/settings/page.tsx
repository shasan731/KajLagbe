import Link from "next/link";

export const metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <div className="container-app py-6 space-y-4 max-w-2xl">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <div className="card p-5 space-y-3 text-sm">
        <p className="text-gray-700">
          Account settings are managed from your{" "}
          <Link href="/dashboard/profile" className="text-brand-700 hover:underline">
            profile page
          </Link>
          .
        </p>
        <p className="text-gray-700">
          Notification preferences and language toggle will be available in a future release.
        </p>
      </div>
    </div>
  );
}
