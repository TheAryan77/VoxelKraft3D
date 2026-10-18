import "server-only";
import { db } from "@/lib/db";
import { orderLabel } from "@/lib/shop/config";
import { notifyAdmin } from "@/lib/shop/notify";

// Not a server action on purpose: only verified code paths (signature-checked
// checkout confirmation and the webhook) may mark an order as paid.

/** Marks a Razorpay order as paid once its signature checks out. Safe to call twice. */
export async function markRazorpayPaid(razorpayOrderId: string, paymentId: string, source: string) {
  const order = await db.order.findUnique({ where: { razorpayOrderId } });
  if (!order || order.paymentStatus === "PAID") return order;
  const updated = await db.order.update({
    where: { id: order.id },
    data: {
      paymentStatus: "PAID",
      razorpayPaymentId: paymentId,
      status: order.status === "PENDING_PAYMENT" ? "PLACED" : order.status,
      events: { create: { status: "PLACED", note: `Payment received (${source}).` } },
    },
  });
  await notifyAdmin(`New order ${orderLabel(order.number)} (paid online)`, `Total ${order.total / 100} INR. Open /admin/orders/${order.id}`);
  return updated;
}

