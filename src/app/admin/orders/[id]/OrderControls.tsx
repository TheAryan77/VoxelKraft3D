"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { OrderStatus, PaymentMethod, PaymentStatus } from "@prisma/client";
import { addOrderNote, adminMessageAboutOrder, setPaymentStatus, setTracking, updateOrderStatus } from "@/lib/shop/actions/admin";
import { ORDER_STATUS_LABEL } from "@/lib/shop/status";
import { Button, Card, Field, inputStyles } from "@/components/shop/ui";
import { cn } from "@/lib/utils";

const NEXT: Partial<Record<OrderStatus, OrderStatus>> = { PLACED: "CONFIRMED", CONFIRMED: "PRINTING", PRINTING: "SHIPPED", SHIPPED: "DELIVERED" };

export function OrderControls({
  orderId,
  status,
  paymentMethod,
  paymentStatus,
  tracking,
  conversations,
}: {
  orderId: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  tracking: { courier: string; trackingNumber: string; trackingUrl: string };
  conversations: { id: string; subject: string; adminUnread: boolean }[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [newStatus, setNewStatus] = useState<OrderStatus>(NEXT[status] ?? status);
  const [note, setNote] = useState("");
  const [t, setT] = useState(tracking);
  const [chat, setChat] = useState("");

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, done: string, after?: () => void) =>
    start(async () => {
      const r = await fn();
      setMsg(r.ok ? { ok: true, text: done } : { ok: false, text: r.error ?? "Something went wrong" });
      if (r.ok) after?.();
      router.refresh();
    });

  const next = NEXT[status];

  return (
    <Card className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <h2 className="font-heading text-lg text-text">Update order</h2>
        {next && (
          <Button className="self-start" disabled={pending} onClick={() => run(() => updateOrderStatus(orderId, next), `Marked as ${ORDER_STATUS_LABEL[next]}`)}>
            Mark as {ORDER_STATUS_LABEL[next].toLowerCase()}
          </Button>
        )}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[200px_1fr_auto] sm:items-end">
          <Field label="Status">
            <select value={newStatus} onChange={(e) => setNewStatus(e.target.value as OrderStatus)} className={inputStyles}>
              {(Object.keys(ORDER_STATUS_LABEL) as OrderStatus[]).map((s) => (
                <option key={s} value={s}>
                  {ORDER_STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Message for the customer (optional)">
            <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder="Shown on their tracking page" className={inputStyles} />
          </Field>
          <Button
            variant="outline"
            disabled={pending}
            onClick={() => {
              if (newStatus === "CANCELLED" && !window.confirm("Cancel this order? Stock is put back.")) return;
              run(() => updateOrderStatus(orderId, newStatus, note), "Status updated", () => setNote(""));
            }}
          >
            Save
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-line pt-5">
        <h3 className="text-sm text-text">Shipping & tracking</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Field label="Courier">
            <input value={t.courier} onChange={(e) => setT({ ...t, courier: e.target.value })} placeholder="Delhivery, India Post…" className={inputStyles} />
          </Field>
          <Field label="Tracking number">
            <input value={t.trackingNumber} onChange={(e) => setT({ ...t, trackingNumber: e.target.value })} className={inputStyles} />
          </Field>
          <Field label="Tracking link">
            <input value={t.trackingUrl} onChange={(e) => setT({ ...t, trackingUrl: e.target.value })} placeholder="https://" className={inputStyles} />
          </Field>
        </div>
        <Button variant="outline" className="self-start" disabled={pending} onClick={() => run(() => setTracking(orderId, t), "Tracking saved")}>
          Save tracking
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-line pt-5">
        <h3 className="text-sm text-text">Payment</h3>
        {paymentStatus !== "PAID" && (
          <Button variant="outline" disabled={pending} onClick={() => run(() => setPaymentStatus(orderId, "PAID"), "Marked as paid")}>
            {paymentMethod === "COD" ? "Cash collected" : "Mark as paid"}
          </Button>
        )}
        {paymentStatus === "PAID" && (
          <Button variant="ghost" disabled={pending} onClick={() => window.confirm("Mark this payment as refunded? Do the refund in Razorpay first.") && run(() => setPaymentStatus(orderId, "REFUNDED"), "Marked as refunded")}>
            Mark as refunded
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-3 border-t border-line pt-5">
        <h3 className="text-sm text-text">Message the customer</h3>
        {conversations.map((c) => (
          <Link key={c.id} href={`/admin/support/${c.id}`} className={cn("text-sm underline-offset-4 hover:underline", c.adminUnread ? "text-molten" : "text-text-muted")}>
            {c.adminUnread ? "New reply: " : "Open chat: "}
            {c.subject}
          </Link>
        ))}
        <textarea value={chat} onChange={(e) => setChat(e.target.value)} rows={2} maxLength={2000} placeholder="They'll see this in their account under Help & chat." className={cn(inputStyles, "h-auto py-3")} />
        <Button variant="outline" className="self-start" disabled={pending || !chat.trim()} onClick={() => run(() => adminMessageAboutOrder(orderId, chat), "Message sent", () => setChat(""))}>
          Send message
        </Button>
        <details className="text-sm">
          <summary className="cursor-pointer text-text-muted">Add a note to the tracking timeline</summary>
          <InternalNote onSave={(text) => run(() => addOrderNote(orderId, text), "Note added")} pending={pending} />
        </details>
      </div>

      {msg && (
        <p role="status" className={msg.ok ? "text-sm text-text-muted" : "text-sm text-error"}>
          {msg.text}
        </p>
      )}
    </Card>
  );
}

function InternalNote({ onSave, pending }: { onSave: (text: string) => void; pending: boolean }) {
  const [text, setText] = useState("");
  return (
    <div className="mt-3 flex flex-col gap-2">
      <p className="text-xs text-text-muted">Timeline notes are visible to the customer on their tracking page.</p>
      <input value={text} onChange={(e) => setText(e.target.value)} maxLength={500} className={inputStyles} />
      <Button variant="ghost" className="self-start" disabled={pending || !text.trim()} onClick={() => { onSave(text); setText(""); }}>
        Add note
      </Button>
    </div>
  );
}
