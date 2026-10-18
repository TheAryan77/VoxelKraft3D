import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/shop/session";
import { formatPrice } from "@/lib/shop/money";
import { orderLabel } from "@/lib/shop/config";
import { ButtonLink, Card, EmptyState, StatusBadge } from "@/components/shop/ui";
import { ProfileForm } from "./ProfileForm";

export const metadata: Metadata = { title: "Your account" };

const date = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" });

export default async function AccountPage() {
  const sessionUser = await requireUser("/account");
  const [user, orders, unread] = await Promise.all([
    db.user.findUniqueOrThrow({ where: { id: sessionUser.id }, select: { name: true, phone: true } }),
    db.order.findMany({ where: { userId: sessionUser.id }, orderBy: { createdAt: "desc" }, take: 3 }),
    db.conversation.count({ where: { userId: sessionUser.id, customerUnread: true } }),
  ]);
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <div className="flex flex-col gap-4 lg:col-span-8">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-xl text-text">Recent orders</h2>
          <Link href="/account/orders" className="text-sm text-text-muted hover:text-text">See all</Link>
        </div>
        {orders.length ? (
          orders.map((o) => (
            <Link key={o.id} href={`/account/orders/${o.id}`}>
              <Card className="flex items-center justify-between gap-4 transition-colors hover:border-pei/40">
                <div>
                  <p className="font-machine text-sm text-text">{orderLabel(o.number)}</p>
                  <p className="text-xs text-text-muted">{date.format(o.createdAt)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-machine text-sm text-text">{formatPrice(o.total)}</span>
                  <StatusBadge status={o.status} />
                </div>
              </Card>
            </Link>
          ))
        ) : (
          <EmptyState title="No orders yet" action={<ButtonLink href="/shop">Browse the shop</ButtonLink>} />
        )}
        {unread > 0 && (
          <Link href="/account/support">
            <Card className="border-molten/50 text-sm text-text">You have {unread} new {unread === 1 ? "reply" : "replies"} from Voxel Kraft.</Card>
          </Link>
        )}
      </div>
      <div className="lg:col-span-4">
        <Card>
          <h2 className="mb-4 font-heading text-lg text-text">Profile</h2>
          <ProfileForm name={user.name ?? ""} phone={user.phone ?? ""} />
        </Card>
      </div>
    </div>
  );
}
