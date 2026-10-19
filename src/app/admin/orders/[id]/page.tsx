import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/shop/money";
import { orderLabel } from "@/lib/shop/config";
import { PAYMENT_STATUS_LABEL } from "@/lib/shop/status";
import { Card, Pill, StatusBadge } from "@/components/shop/ui";
import { OrderTimeline } from "@/components/shop/OrderTimeline";
import { OrderControls } from "./OrderControls";
import { syncRazorpayPayment } from "@/lib/shop/payments";

const date = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });

export default async function AdminOrder({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const load = () => db.order.findUnique({
    where: { id },
    include: {
      items: true,
      events: { orderBy: { createdAt: "asc" } },
      user: { select: { name: true, email: true, phone: true, _count: { select: { orders: true } } } },
      conversations: { select: { id: true, subject: true, adminUnread: true }, orderBy: { lastMessageAt: "desc" } },
    },
  });
  let order = await load();
  if (!order) notFound();
  // Catch up an online payment that never got confirmed back to us.
  if (await syncRazorpayPayment(order)) order = (await load())!;
  const address = [order.shipLine1, order.shipLine2, order.shipCity, `${order.shipState} ${order.shipPincode}`].filter(Boolean).join(", ");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/admin/orders" className="text-sm text-text-muted hover:text-text">← Orders</Link>
        <h1 className="font-machine text-2xl text-text">{orderLabel(order.number)}</h1>
        <StatusBadge status={order.status} />
        <Pill>{order.paymentMethod === "COD" ? "Cash on delivery" : "Online"} · {PAYMENT_STATUS_LABEL[order.paymentStatus]}</Pill>
        <span className="text-xs text-text-muted">{date.format(order.createdAt)}</span>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="flex flex-col gap-6 xl:col-span-7">
          <OrderControls
            // Remount after each status change so the "next step" defaults reset.
            key={`${order.status}-${order.paymentStatus}`}
            orderId={order.id}
            status={order.status}
            paymentMethod={order.paymentMethod}
            paymentStatus={order.paymentStatus}
            tracking={{ courier: order.courier ?? "", trackingNumber: order.trackingNumber ?? "", trackingUrl: order.trackingUrl ?? "" }}
            conversations={order.conversations}
          />
          <Card>
            <h2 className="mb-5 font-heading text-lg text-text">Timeline</h2>
            <OrderTimeline status={order.status} events={order.events} />
          </Card>
        </div>

        <div className="flex flex-col gap-6 xl:col-span-5">
          <Card>
            <h2 className="mb-4 font-heading text-lg text-text">Items</h2>
            <ul className="flex flex-col gap-3">
              {order.items.map((i) => (
                <li key={i.id} className="flex gap-3">
                  <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[10px] bg-surface-2">
                    {i.image && <Image src={i.image} alt="" fill sizes="64px" className="object-cover" />}
                  </span>
                  <div className="flex-1 text-sm">
                    <p className="text-text">{i.name}</p>
                    <p className="text-xs text-text-muted">
                      {i.color ? `Colour: ${i.color} · ` : ""}Qty {i.quantity} × {formatPrice(i.unitPrice)}
                    </p>
                  </div>
                  <span className="font-machine text-sm text-text">{formatPrice(i.unitPrice * i.quantity)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 flex flex-col gap-1 border-t border-line pt-4 text-sm">
              <div className="flex justify-between"><dt className="text-text-muted">Subtotal</dt><dd className="font-machine">{formatPrice(order.subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-text-muted">Shipping</dt><dd className="font-machine">{order.shipping ? formatPrice(order.shipping) : "Free"}</dd></div>
              <div className="flex justify-between text-base"><dt className="text-text">Total</dt><dd className="font-machine text-text">{formatPrice(order.total)}</dd></div>
            </dl>
            {order.razorpayPaymentId && <p className="mt-3 font-machine text-xs text-text-muted">Razorpay payment {order.razorpayPaymentId}</p>}
          </Card>
          <Card className="flex flex-col gap-1 text-sm">
            <h2 className="mb-2 font-heading text-lg text-text">Ship to</h2>
            <p className="text-text">{order.shipName}</p>
            <p className="text-text-muted">{address}</p>
            <a href={`tel:${order.shipPhone}`} className="text-molten underline-offset-4 hover:underline">{order.shipPhone}</a>
            {order.customerNote && <p className="mt-3 rounded-[12px] border border-line p-3 text-text-muted"><span className="text-text">Customisation:</span> {order.customerNote}</p>}
          </Card>
          <Card className="flex flex-col gap-1 text-sm">
            <h2 className="mb-2 font-heading text-lg text-text">Customer</h2>
            <p className="text-text">{order.user.name ?? "—"}</p>
            <p className="text-text-muted">{order.user.email}</p>
            {order.user.phone && <p className="text-text-muted">{order.user.phone}</p>}
            <p className="text-xs text-text-muted">{order.user._count.orders} {order.user._count.orders === 1 ? "order" : "orders"} in total</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
