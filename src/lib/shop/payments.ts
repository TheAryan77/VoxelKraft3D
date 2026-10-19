import "server-only";
import { db } from "@/lib/db";
import { orderLabel } from "@/lib/shop/config";
import { notifyAdmin } from "@/lib/shop/notify";
import { findCapturedPayment, razorpayEnabled } from "@/lib/shop/razorpay";

// Not a server action on purpose: only verified code paths (signature-checked
// checkout confirmation, the webhook, or Razorpay's own API) may mark an order as paid.

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


/**
 * If the buyer paid but closed the tab before checkout confirmed it (and no
 * webhook has arrived), ask Razorpay and catch the order up. Called when an
 * unpaid online order is viewed or retried. Returns true if it's now paid.
 */
export async function syncRazorpayPayment(order: { paymentMethod: string; paymentStatus: string; razorpayOrderId: string | null; status: string }) {
  if (!razorpayEnabled || order.paymentMethod !== "RAZORPAY" || order.paymentStatus === "PAID" || !order.razorpayOrderId || order.status === "CANCELLED") return false;
  try {
    const payment = await findCapturedPayment(order.razorpayOrderId);
    if (!payment) return false;
    await markRazorpayPaid(order.razorpayOrderId, payment.id, "confirmed with Razorpay");
    return true;
  } catch (err) {
    console.error("[payments] sync failed", err);
    return false;
  }
}
