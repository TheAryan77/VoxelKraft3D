"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { assertAdmin, assertUser } from "@/lib/shop/session";
import { notifyAdmin } from "@/lib/shop/notify";
import { MAX_ATTACHMENTS, isOurAttachmentUrl } from "@/lib/shop/attachments";

const body = z.string().trim().min(1, "Write a message").max(2000);
const attachments = z
  .array(z.string().max(500).refine(isOurAttachmentUrl, "One of the files didn't upload properly. Remove it and try again."))
  .max(MAX_ATTACHMENTS)
  .default([]);

const withFiles = (text: string, files: string[]) => (files.length ? `${text}\n\n${files.length} file(s) attached.` : text);

export async function startConversation(input: { subject: string; message: string; orderId?: string; attachments?: string[] }) {
  const user = await assertUser();
  const parsed = z
    .object({ subject: z.string().trim().min(2, "Add a subject").max(120), message: body, orderId: z.string().optional(), attachments })
    .safeParse(input);
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
      messages: { create: { sender: "CUSTOMER", body: parsed.data.message, attachments: parsed.data.attachments } },
    },
  });
  await notifyAdmin(`New message: ${parsed.data.subject}`, `${withFiles(parsed.data.message, parsed.data.attachments)}\n\nReply at /admin/support/${convo.id}`);
  return { ok: true as const, id: convo.id };
}

/** Customer or admin reply. Who's sending is worked out from the session, not the client. */
export async function sendMessage(conversationId: string, text: string, files: string[] = []) {
  const user = await assertUser();
  // A message can be just files, just text, or both.
  const parsed = z
    .object({ text: z.string().trim().max(2000), files: attachments })
    .refine((m) => m.text || m.files.length, "Write a message")
    .safeParse({ text, files });
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
      messages: { create: { sender, body: parsed.data.text, attachments: parsed.data.files } },
    },
  });
  if (sender === "CUSTOMER") await notifyAdmin(`New reply: ${convo.subject}`, `${withFiles(parsed.data.text, parsed.data.files)}\n\nReply at /admin/support/${convo.id}`);
  return { ok: true as const };
}

export async function setConversationStatus(conversationId: string, status: "OPEN" | "CLOSED") {
  await assertAdmin();
  await db.conversation.update({ where: { id: conversationId }, data: { status } });
  revalidatePath(`/admin/support/${conversationId}`);
  revalidatePath("/admin/support");
  return { ok: true as const };
}
