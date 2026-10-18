import Link from "next/link";
import type { OrderStatus, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/shop/money";
import { orderLabel } from "@/lib/shop/config";
import { ORDER_STATUS_LABEL } from "@/lib/shop/status";
import { Card, Pill, StatusBadge, inputStyles } from "@/components/shop/ui";
import { cn } from "@/lib/utils";

const date = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

const FILTERS: { key: string; label: string; where: Prisma.OrderWhereInput }[] = [
  { key: "all", label: "All", where: { status: { not: "PENDING_PAYMENT" } } },
  { key: "PLACED", label: "To confirm", where: { status: "PLACED" } },
  { key: "active", label: "In progress", where: { status: { in: ["CONFIRMED", "PRINTING", "SHIPPED"] } } },
  { key: "DELIVERED", label: "Delivered", where: { status: "DELIVERED" } },
  { key: "CANCELLED", label: "Cancelled", where: { status: "CANCELLED" } },
  { key: "PENDING_PAYMENT", label: "Unpaid", where: { status: "PENDING_PAYMENT" } },
];

export default async function AdminOrders({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const { status = "all", q } = await searchParams;
  const filter = FILTERS.find((f) => f.key === status) ?? FILTERS[0];
  const search = q?.trim();
  const number = search ? Number(search.replace(/\D/g, "")) : NaN;
  const where: Prisma.OrderWhereInput = {
    ...filter.where,
    ...(search
      ? {
          OR: [
            ...(Number.isFinite(number) && number > 0 ? [{ number }] : []),
            { shipName: { contains: search, mode: "insensitive" as const } },
            { shipPhone: { contains: search } },
            { user: { email: { contains: search, mode: "insensitive" as const } } },
          ],
        }
      : {}),
  };
  const orders = await db.order.findMany({ where, orderBy: { createdAt: "desc" }, take: 100, include: { user: { select: { email: true } }, _count: { select: { items: true } } } });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <h1 className="font-heading text-3xl text-text">Orders</h1>
        <form className="w-full md:w-72">
          <input type="hidden" name="status" value={status} />
          <input name="q" defaultValue={search} placeholder="Order no., name, phone, email" aria-label="Search orders" className={inputStyles} />
        </form>
      </div>
      <nav aria-label="Filter orders" className="no-scrollbar flex gap-2 overflow-x-auto">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={`/admin/orders?status=${f.key}`}
            className={cn("shrink-0 rounded-full border px-4 py-1.5 text-sm", f.key === filter.key ? "border-molten bg-molten text-on-molten" : "border-line text-text-muted hover:text-text")}
          >
            {f.label}
          </Link>
        ))}
      </nav>
      {orders.length === 0 ? (
        <Card className="text-sm text-text-muted">No orders here.</Card>
      ) : (
        <Card className="overflow-x-auto p-0 md:p-0">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-line text-xs text-text-muted">
              <tr>
                <th className="px-5 py-3 font-normal">Order</th>
                <th className="px-5 py-3 font-normal">Customer</th>
                <th className="px-5 py-3 font-normal">Placed</th>
                <th className="px-5 py-3 font-normal">Payment</th>
                <th className="px-5 py-3 font-normal">Total</th>
                <th className="px-5 py-3 font-normal">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-surface-2/50">
                  <td className="px-5 py-3">
                    <Link href={`/admin/orders/${o.id}`} className="font-machine text-text underline-offset-4 hover:underline">
                      {orderLabel(o.number)}
                    </Link>
                    <p className="text-xs text-text-muted">{o._count.items} items</p>
                  </td>
                  <td className="px-5 py-3">
                    <p className="text-text">{o.shipName}</p>
                    <p className="text-xs text-text-muted">{o.user.email}</p>
                  </td>
                  <td className="px-5 py-3 text-text-muted">{date.format(o.createdAt)}</td>
                  <td className="px-5 py-3">
                    <Pill>{o.paymentMethod === "COD" ? "COD" : "Online"} · {o.paymentStatus.toLowerCase()}</Pill>
                  </td>
                  <td className="px-5 py-3 font-machine text-text">{formatPrice(o.total)}</td>
                  <td className="px-5 py-3">
                    <StatusBadge status={o.status as OrderStatus} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      <p className="text-xs text-text-muted">Showing up to 100 orders. {ORDER_STATUS_LABEL.PENDING_PAYMENT} orders are online payments that weren&apos;t completed.</p>
    </div>
  );
}
