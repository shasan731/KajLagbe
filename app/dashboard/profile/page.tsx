import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ProfileForm } from "./profile-form";
import { logoutAction } from "@/app/actions/auth";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await requireUser();
  const profile = await prisma.userProfile.findUnique({ where: { userId: user.id } });
  return (
    <div className="container-app py-6 max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My profile</h1>
        <form action={logoutAction}>
          <button className="btn-ghost text-sm">Log out</button>
        </form>
      </div>
      <div className="card p-5">
        <div className="text-sm text-gray-600 mb-2">
          Phone: <span className="text-gray-900 font-medium">{user.phone}</span> · Role:{" "}
          <span className="text-gray-900 font-medium">{user.role}</span>
        </div>
        <ProfileForm
          defaultValues={{
            name: user.name,
            email: user.email ?? "",
            bio: profile?.bio ?? "",
            city: profile?.city ?? "",
            addressArea: profile?.addressArea ?? "",
            avatarUrl: profile?.avatarUrl ?? "",
          }}
        />
      </div>
    </div>
  );
}
