"use client";

import { currentAccentHex } from "@/lib/theme";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cancelOrder } from "@/lib/shop/actions/account";
import { confirmRazorpayPayment, retryRazorpayPayment } from "@/lib/shop/actions/checkout";
import { Button, ButtonLink, Card } from "@/components/shop/ui";

export function OrderActions({ orderId, canPay, canCancel, conversationId, orderLabel }: { orderId: string; canPay: boolean; canCancel: boolean; conversationId?: string; orderLabel: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const pay = () =>
    start(async () => {
      setError(null);
      const r = await retryRazorpayPayment(orderId);
      if (!r.ok || !r.razorpay) return setError(r.ok ? "Payment isn't needed." : r.error);
      if (!window.Razorpay) {
        await new Promise<void>((resolve) => {
          const s = document.createElement("script");
          s.src = "https://checkout.razorpay.com/v1/checkout.js";
          s.onload = () => resolve();
          s.onerror = () => resolve();
          document.body.appendChild(s);
        });
      }
      if (!window.Razorpay) return setError("Couldn't load the payment window.");
      new window.Razorpay({
        key: r.razorpay.keyId,
        order_id: r.razorpay.orderId,
        amount: r.razorpay.amount,
        currency: "INR",
        name: "Voxel Kraft 3D",
        description: `Order ${r.razorpay.label}`,
        theme: { color: currentAccentHex() },
        handler: (resp: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) =>
          start(async () => {
            const c = await confirmRazorpayPayment({ orderId, razorpayOrderId: resp.razorpay_order_id, razorpayPaymentId: resp.razorpay_payment_id, razorpaySignature: resp.razorpay_signature });
            if (!c.ok) setError(c.error);
            router.refresh();
          }),
      }).open();
    });

  const cancel = () => {
    if (!window.confirm("Cancel this order?")) return;
    start(async () => {
      const r = await cancelOrder(orderId);
      if (!r.ok) setError(r.error);
      router.refresh();
    });
  };

  return (
    <Card className="flex flex-col gap-3">
      <h2 className="font-heading text-lg text-text">Need anything?</h2>
      <div className="flex flex-wrap gap-3">
        {canPay && <Button onClick={pay} disabled={pending}>Pay now</Button>}
        {conversationId ? (
          <ButtonLink variant="outline" href={`/account/support/${conversationId}`}>Open chat about this order</ButtonLink>
        ) : (
          <ButtonLink variant="outline" href={`/account/support/new?order=${orderId}&subject=${encodeURIComponent(`Order ${orderLabel}`)}`}>
            Chat with us about this order
          </ButtonLink>
        )}
        {canCancel && (
          <Button variant="danger" onClick={cancel} disabled={pending}>
            Cancel order
          </Button>
        )}
      </div>
      {error && <p className="text-sm text-error">{error}</p>}
    </Card>
  );
}
