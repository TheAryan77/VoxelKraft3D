import { db } from "@/lib/db";
import { formatPrice } from "@/lib/shop/money";
import { Card, Pill } from "@/components/shop/ui";

const date = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" });

export default async function AdminCustomers() {
  const [users, spend] = await Promise.all([
    db.user.findMany({ orderBy: { createdAt: "desc" }, take: 200, include: { _count: { select: { orders: true } } } }),
    db.order.groupBy({ by: ["userId"], _sum: { total: true }, where: { status: { notIn: ["CANCELLED", "PENDING_PAYMENT"] } } }),
  ]);
  const spent = new Map(spend.map((s) => [s.userId, s._sum.total ?? 0]));
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-heading text-3xl text-text">Customers</h1>
      <Card className="overflow-x-auto p-0 md:p-0">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-line text-xs text-text-muted">
            <tr>
              <th className="px-5 py-3 font-normal">Customer</th>
              <th className="px-5 py-3 font-normal">Phone</th>
              <th className="px-5 py-3 font-normal">Joined</th>
              <th className="px-5 py-3 font-normal">Orders</th>
              <th className="px-5 py-3 font-normal">Spent</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-5 py-3">
                  <p className="flex items-center gap-2 text-text">
                    {u.name ?? "—"} {u.role === "ADMIN" && <Pill>Admin</Pill>}
                  </p>
                  <p className="text-xs text-text-muted">{u.email}</p>
                </td>
                <td className="px-5 py-3 text-text-muted">{u.phone ?? "—"}</td>
                <td className="px-5 py-3 text-text-muted">{date.format(u.createdAt)}</td>
                <td className="px-5 py-3 font-machine text-text">{u._count.orders}</td>
                <td className="px-5 py-3 font-machine text-text">{formatPrice(spent.get(u.id) ?? 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
