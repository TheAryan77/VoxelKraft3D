import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/shop/session";
import { formatPrice } from "@/lib/shop/money";
import { orderLabel, shopPolicy } from "@/lib/shop/config";
import { PAYMENT_STATUS_LABEL, isEditable } from "@/lib/shop/status";
import { razorpayEnabled } from "@/lib/shop/razorpay";
import { syncRazorpayPayment } from "@/lib/shop/payments";
import { ButtonLink, Card, Pill, StatusBadge } from "@/components/shop/ui";
import { OrderTimeline } from "@/components/shop/OrderTimeline";
import { OrderActions } from "./OrderActions";
import { CustomisationEditor } from "./CustomisationEditor";

export const metadata: Metadata = { title: "Order" };
export const dynamic = "force-dynamic";

export default async function OrderPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ placed?: string }> }) {
  const { id } = await params;
  const { placed } = await searchParams;
  const user = await requireUser(`/account/orders/${id}`);
  const where = { id, userId: user.id };
  const include = { items: true, events: { orderBy: { createdAt: "asc" as const } }, conversations: { select: { id: true }, take: 1 } };
  let order = await db.order.findFirst({ where, include });
  if (!order) notFound();
  if (await syncRazorpayPayment(order)) order = (await db.order.findFirst({ where, include }))!;
  const canPay = order.paymentMethod === "RAZORPAY" && order.paymentStatus !== "PAID" && order.status !== "CANCELLED" && razorpayEnabled;
  const canCancel = isEditable(order.status);
  const delivered = order.status === "DELIVERED";

  return (
    <div className="flex flex-col gap-6">
      {placed && (
        <Card className="border-molten/50">
          <p className="font-heading text-lg text-text">Thank you! Your order is in.</p>
          <p className="mt-1 text-sm text-text-muted">We&apos;ll confirm it shortly and keep this page updated as it&apos;s printed and shipped.</p>
        </Card>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Link href="/account/orders" className="text-sm text-text-muted hover:text-text">← All orders</Link>
        <span className="font-machine text-lg text-text">{orderLabel(order.number)}</span>
        <StatusBadge status={order.status} />
        <Pill>{order.paymentMethod === "COD" ? "Cash on delivery" : PAYMENT_STATUS_LABEL[order.paymentStatus]}</Pill>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="flex flex-col gap-6 lg:col-span-7">
          <Card>
            <h2 className="mb-5 font-heading text-lg text-text">Tracking</h2>
            <OrderTimeline status={order.status} events={order.events} />
            {(order.trackingNumber || order.courier) && (
              <div className="mt-6 rounded-[14px] border border-line p-4 text-sm">
                <p className="text-text">
                  {order.courier ?? "Courier"}
                  {order.trackingNumber && <span className="font-machine text-text-muted"> · {order.trackingNumber}</span>}
                </p>
                {order.trackingUrl && (
                  <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-molten underline underline-offset-4">
                    Track with the courier
                  </a>
                )}
              </div>
            )}
          </Card>
          {order.status !== "CANCELLED" && <CustomisationEditor orderId={order.id} note={order.customerNote} editable={isEditable(order.status)} />}
          {delivered && (
            <Card className="flex flex-col gap-3 border-molten/40">
              <h2 className="font-heading text-lg text-text">Something wrong with your order?</h2>
              <p className="text-sm text-text-muted">
                If it arrived damaged or isn&apos;t what you ordered, raise a query with photos or an unboxing video and we&apos;ll sort out an exchange.
              </p>
              <div>
                <ButtonLink href={`/account/support/new?order=${order.id}&query=1`}>Raise a query</ButtonLink>
              </div>
            </Card>
          )}
          <OrderActions orderId={order.id} canPay={canPay} canCancel={canCancel} conversationId={order.conversations[0]?.id} orderLabel={orderLabel(order.number)} />
        </div>

        <div className="flex flex-col gap-6 lg:col-span-5">
          <Card>
            <h2 className="mb-4 font-heading text-lg text-text">Items</h2>
            <ul className="flex flex-col gap-3">
              {order.items.map((i) => (
                <li key={i.id} className="flex gap-3">
                  <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[10px] bg-surface-2">
                    {i.image && <Image src={i.image} alt="" fill sizes="56px" className="object-cover" />}
                  </span>
                  <div className="flex-1 text-sm">
                    <p className="text-text">{i.name}</p>
                    <p className="text-xs text-text-muted">
                      {i.color ? `${i.color} · ` : ""}Qty {i.quantity}
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
          </Card>
          <Card>
            <h2 className="mb-2 font-heading text-lg text-text">Delivering to</h2>
            <p className="text-sm text-text">{order.shipName} · {order.shipPhone}</p>
            <p className="text-sm text-text-muted">{[order.shipLine1, order.shipLine2, order.shipCity, `${order.shipState} ${order.shipPincode}`].filter(Boolean).join(", ")}</p>
          </Card>
          <Card>
            <h2 className="mb-2 font-heading text-lg text-text">{shopPolicy.returns.title}</h2>
            <p className="text-sm text-text-muted">{shopPolicy.returns.body}</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
