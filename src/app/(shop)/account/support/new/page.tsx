import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/shop/session";
import { orderLabel } from "@/lib/shop/config";
import { NewConversation } from "./NewConversation";

export const metadata: Metadata = { title: "New message" };

export default async function NewSupportPage({ searchParams }: { searchParams: Promise<{ order?: string; subject?: string; query?: string }> }) {
  const user = await requireUser("/account/support/new");
  const { order: orderId, subject, query } = await searchParams;
  const order = orderId ? await db.order.findFirst({ where: { id: orderId, userId: user.id }, select: { id: true, number: true } }) : null;
  return (
    <NewConversation
      orderId={order?.id}
      orderLabel={order ? orderLabel(order.number) : undefined}
      subject={subject}
      // "Raise a query" on a delivered order: reason + proof form.
      query={Boolean(query && order)}
    />
  );
}
