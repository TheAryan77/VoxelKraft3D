import { NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/shop/razorpay";
import { markRazorpayPaid } from "@/lib/shop/payments";

export const runtime = "nodejs";

/**
 * Razorpay webhook (payment.captured / order.paid). Backs up the checkout
 * confirmation in case the buyer closes the tab before it finishes.
 * Set it up in Razorpay → Settings → Webhooks with RAZORPAY_WEBHOOK_SECRET.
 */
export async function POST(request: Request) {
  const raw = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";
  if (!verifyWebhookSignature(raw, signature)) return NextResponse.json({ ok: false }, { status: 401 });

  const event = JSON.parse(raw) as {
    event: string;
    payload?: { payment?: { entity?: { id: string; order_id: string } } };
  };
  const payment = event.payload?.payment?.entity;
  if ((event.event === "payment.captured" || event.event === "order.paid") && payment?.order_id) {
    await markRazorpayPaid(payment.order_id, payment.id, "webhook");
  }
  return NextResponse.json({ ok: true });
}
