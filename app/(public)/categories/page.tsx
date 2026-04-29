import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    where: { isActive: true, isBanned: false },
    orderBy: [{ type: "asc" }, { name: "asc" }],
  });
  const tools = categories.filter((c) => c.type === "TOOL_ONLY" || c.type === "TOOL_WITH_OPERATOR");
  const skills = categories.filter((c) => c.type === "SKILL_ONLY" || c.type === "PACKAGE");
  const others = categories.filter((c) => !c.type);

  return (
    <div className="container-app py-6 space-y-8">
      <h1 className="text-2xl font-semibold text-gray-900">Categories</h1>
      <Section title="Tools" items={tools.length ? tools : others} />
      <Section title="Skills & Services" items={skills} />
    </div>
  );
}

function Section({ title, items }: { title: string; items: { id: string; name: string; slug: string }[] }) {
  if (items.length === 0) return null;
  return (
    <section>
      <h2 className="font-semibold text-gray-900 mb-3">{title}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {items.map((c) => (
          <Link key={c.id} href={`/categories/${c.slug}`} className="card p-4 hover:shadow-md transition">
            <div className="font-medium text-gray-900">{c.name}</div>
            <div className="text-xs text-brand-700 mt-1">View listings →</div>
          </Link>
        ))}
      </div>
    </section>
  );
}
