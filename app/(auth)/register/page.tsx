import Link from "next/link";
import { RegisterForm } from "./form";

export const metadata = { title: "Create your account" };

export default function RegisterPage() {
  return (
    <div className="card w-full max-w-md p-6">
      <h1 className="text-xl font-semibold mb-1">Create your KajLagbe account</h1>
      <p className="text-sm text-gray-600 mb-4">
        Phone-first registration. Email is optional.
      </p>
      <RegisterForm />
      <p className="mt-4 text-sm text-gray-600">
        Already have an account?{" "}
        <Link href="/login" className="text-brand-700 font-medium hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
