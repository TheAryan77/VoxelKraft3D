"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { assertAdmin, assertUser } from "@/lib/shop/session";
import { notifyAdmin } from "@/lib/shop/notify";

const body = z.string().trim().min(1, "Write a message").max(2000);

export async function startConversation(input: { subject: string; message: string; orderId?: string }) {
  const user = await assertUser();
  const parsed = z.object({ subject: z.string().trim().min(2, "Add a subject").max(120), message: body, orderId: z.string().optional() }).safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Check your message" };
  if (parsed.data.orderId) {
    const owned = await db.order.findFirst({ where: { id: parsed.data.orderId, userId: user.id } });
    if (!owned) return { ok: false as const, error: "Order not found" };
  }
  const convo = await db.conversation.create({
    data: {
      userId: user.id,
      subject: parsed.data.subject,
      orderId: parsed.data.orderId,
      adminUnread: true,
      messages: { create: { sender: "CUSTOMER", body: parsed.data.message } },
    },
  });
  await notifyAdmin(`New message: ${parsed.data.subject}`, `${parsed.data.message}\n\nReply at /admin/support/${convo.id}`);
  return { ok: true as const, id: convo.id };
}

/** Customer or admin reply. Who's sending is worked out from the session, not the client. */
export async function sendMessage(conversationId: string, text: string) {
  const user = await assertUser();
  const parsed = body.safeParse(text);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Write a message" };
  const convo = await db.conversation.findUnique({ where: { id: conversationId } });
  if (!convo) return { ok: false as const, error: "Conversation not found" };
  const isAdmin = (await db.user.findUnique({ where: { id: user.id }, select: { role: true } }))?.role === "ADMIN";
  const isOwner = convo.userId === user.id;
  if (!isOwner && !isAdmin) return { ok: false as const, error: "Not allowed" };
  const sender = isOwner && !isAdmin ? "CUSTOMER" : "ADMIN";
  await db.conversation.update({
    where: { id: conversationId },
    data: {
      lastMessageAt: new Date(),
      status: "OPEN",
      ...(sender === "CUSTOMER" ? { adminUnread: true } : { customerUnread: true }),
      messages: { create: { sender, body: parsed.data } },
    },
  });
  if (sender === "CUSTOMER") await notifyAdmin(`New reply: ${convo.subject}`, `${parsed.data}\n\nReply at /admin/support/${convo.id}`);
  return { ok: true as const };
}

export async function setConversationStatus(conversationId: string, status: "OPEN" | "CLOSED") {
  await assertAdmin();
  await db.conversation.update({ where: { id: conversationId }, data: { status } });
  revalidatePath(`/admin/support/${conversationId}`);
  revalidatePath("/admin/support");
  return { ok: true as const };
}
