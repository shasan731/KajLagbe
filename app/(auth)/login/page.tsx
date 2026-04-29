import Link from "next/link";
import { LoginForm } from "./form";

export const metadata = { title: "Log in" };

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; next?: string };
}) {
  return (
    <div className="card w-full max-w-md p-6">
      <h1 className="text-xl font-semibold mb-1">Log in to KajLagbe</h1>
      <p className="text-sm text-gray-600 mb-4">Use your phone number and password.</p>
      {searchParams?.error === "suspended" && (
        <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Your account is suspended. Contact admin.
        </div>
      )}
      <LoginForm next={searchParams?.next} />
      <p className="mt-4 text-sm text-gray-600">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-brand-700 font-medium hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
