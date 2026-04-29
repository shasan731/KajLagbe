import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NewCategoryForm, ToggleClient } from "./category-actions";

export const dynamic = "force-dynamic";

export default async function AdminCategories() {
  await requireAdmin();
  const categories = await prisma.category.findMany({
    orderBy: [{ type: "asc" }, { name: "asc" }],
  });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Categories</h1>
      <NewCategoryForm />
      <div className="card divide-y divide-gray-100">
        {categories.map((c) => (
          <div key={c.id} className="flex items-center justify-between p-4">
            <div>
              <div className="font-medium">{c.name}</div>
              <div className="text-xs text-gray-500">
                slug: {c.slug} · {c.type ?? "any"} · {c.isActive ? "active" : "inactive"}
                {c.isRestricted && " · restricted"}
                {c.isBanned && " · banned"}
              </div>
            </div>
            <ToggleClient id={c.id} isActive={c.isActive} />
          </div>
        ))}
      </div>
    </div>
  );
}
