import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/shop/session";
import { formatPrice } from "@/lib/shop/money";
import { orderLabel } from "@/lib/shop/config";
import { ButtonLink, Card, EmptyState, StatusBadge } from "@/components/shop/ui";

export const metadata: Metadata = { title: "Your orders" };

const date = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" });

export default async function OrdersPage() {
  const user = await requireUser("/account/orders");
  const orders = await db.order.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, include: { items: true } });
  if (!orders.length) return <EmptyState title="No orders yet" body="When you order, you'll be able to track it here." action={<ButtonLink href="/shop">Browse the shop</ButtonLink>} />;
  return (
    <ul className="flex flex-col gap-3">
      {orders.map((o) => (
        <li key={o.id}>
          <Link href={`/account/orders/${o.id}`}>
            <Card className="flex flex-col gap-4 transition-colors hover:border-pei/40 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex -space-x-3">
                  {o.items.slice(0, 3).map((i) => (
                    <span key={i.id} className="relative h-14 w-14 overflow-hidden rounded-[12px] border-2 border-surface bg-surface-2">
                      {i.image && <Image src={i.image} alt="" fill sizes="56px" className="object-cover" />}
                    </span>
                  ))}
                </div>
                <div>
                  <p className="font-machine text-sm text-text">{orderLabel(o.number)}</p>
                  <p className="text-xs text-text-muted">
                    {date.format(o.createdAt)} · {o.items.reduce((n, i) => n + i.quantity, 0)} items
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-machine text-sm text-text">{formatPrice(o.total)}</span>
                <StatusBadge status={o.status} />
              </div>
            </Card>
          </Link>
        </li>
      ))}
    </ul>
  );
}
