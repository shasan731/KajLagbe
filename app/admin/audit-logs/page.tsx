import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default async function AuditLogs() {
  await requireAdmin();
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { user: { select: { name: true } } },
  });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Audit logs</h1>
      {logs.length === 0 ? (
        <p className="text-sm text-gray-500">No audit log entries yet.</p>
      ) : (
        <div className="card divide-y divide-gray-100">
          {logs.map((l) => (
            <div key={l.id} className="p-3 text-sm">
              <div className="font-medium">
                {l.action} · {l.entityType}
                {l.entityId ? `:${l.entityId.slice(-6)}` : ""}
              </div>
              <div className="text-xs text-gray-500">
                {l.user?.name ?? "system"} · {formatDateTime(l.createdAt)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
