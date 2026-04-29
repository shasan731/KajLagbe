import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminSettings() {
  await requireAdmin();
  const settings = await prisma.platformSetting.findMany({ orderBy: { key: "asc" } });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Platform settings</h1>
      <div className="card p-5">
        <p className="text-sm text-gray-700">
          Settings are stored in the <code>PlatformSetting</code> table. A UI editor is planned for the next release. Edit values via Prisma Studio for now.
        </p>
        <table className="mt-4 w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500">
              <th className="py-1">Key</th>
              <th className="py-1">Value</th>
              <th className="py-1">Description</th>
            </tr>
          </thead>
          <tbody>
            {settings.map((s) => (
              <tr key={s.id} className="border-t border-gray-100">
                <td className="py-1 font-medium">{s.key}</td>
                <td className="py-1">{s.value}</td>
                <td className="py-1 text-gray-600">{s.description ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
