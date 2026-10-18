import Link from "next/link";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/shop/money";
import { orderLabel } from "@/lib/shop/config";
import { Card, StatusBadge } from "@/components/shop/ui";

const date = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

export default async function AdminDashboard() {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [toConfirm, inProgress, ordersToday, monthRevenue, unreadChats, recent, lowStock] = await Promise.all([
    db.order.count({ where: { status: "PLACED" } }),
    db.order.count({ where: { status: { in: ["CONFIRMED", "PRINTING", "SHIPPED"] } } }),
    db.order.count({ where: { createdAt: { gte: startOfDay }, status: { not: "PENDING_PAYMENT" } } }),
    db.order.aggregate({ _sum: { total: true }, where: { createdAt: { gte: startOfMonth }, status: { notIn: ["CANCELLED", "PENDING_PAYMENT"] } } }),
    db.conversation.count({ where: { adminUnread: true, status: "OPEN" } }),
    db.order.findMany({ where: { status: { not: "PENDING_PAYMENT" } }, orderBy: { createdAt: "desc" }, take: 8, include: { user: { select: { name: true, email: true } } } }),
    db.product.findMany({ where: { isActive: true, stock: { lte: 3, not: null } }, orderBy: { stock: "asc" }, take: 5 }),
  ]);

  const stats = [
    { label: "New orders to confirm", value: toConfirm, href: "/admin/orders?status=PLACED", live: toConfirm > 0 },
    { label: "In progress", value: inProgress, href: "/admin/orders?status=active" },
    { label: "Orders today", value: ordersToday, href: "/admin/orders" },
    { label: "Sales this month", value: formatPrice(monthRevenue._sum.total ?? 0), href: "/admin/orders" },
    { label: "Unread messages", value: unreadChats, href: "/admin/support", live: unreadChats > 0 },
  ];

  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-heading text-3xl text-text">Dashboard</h1>
      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {stats.map((s) => (
          <li key={s.label}>
            <Link href={s.href}>
              <Card className={s.live ? "border-molten/60 transition-colors hover:border-molten" : "transition-colors hover:border-pei/40"}>
                <p className="font-machine text-2xl text-text">{s.value}</p>
                <p className="mt-1 text-xs text-text-muted">{s.label}</p>
              </Card>
            </Link>
          </li>
        ))}
      </ul>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-heading text-lg text-text">Latest orders</h2>
            <Link href="/admin/orders" className="text-sm text-text-muted hover:text-text">All orders</Link>
          </div>
          {recent.length === 0 ? (
            <p className="text-sm text-text-muted">No orders yet.</p>
          ) : (
            <ul className="divide-y divide-line">
              {recent.map((o) => (
                <li key={o.id}>
                  <Link href={`/admin/orders/${o.id}`} className="flex items-center justify-between gap-3 py-3 hover:opacity-80">
                    <div className="min-w-0">
                      <p className="font-machine text-sm text-text">{orderLabel(o.number)}</p>
                      <p className="truncate text-xs text-text-muted">{o.user.name ?? o.user.email} · {date.format(o.createdAt)}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="font-machine text-sm">{formatPrice(o.total)}</span>
                      <StatusBadge status={o.status} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <h2 className="mb-4 font-heading text-lg text-text">Low stock</h2>
          {lowStock.length === 0 ? (
            <p className="text-sm text-text-muted">Nothing running low. Products without a stock number are made to order.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {lowStock.map((p) => (
                <li key={p.id} className="flex justify-between text-sm">
                  <Link href={`/admin/products/${p.id}`} className="text-text hover:underline">{p.name}</Link>
                  <span className={p.stock === 0 ? "font-machine text-error" : "font-machine text-text-muted"}>{p.stock} left</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
