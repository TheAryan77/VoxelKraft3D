import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/shop/session";
import { orderLabel } from "@/lib/shop/config";
import { ChatThread } from "@/components/shop/ChatThread";

export const metadata: Metadata = { title: "Chat" };
export const dynamic = "force-dynamic";

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/account/support/${id}`);
  const convo = await db.conversation.findFirst({
    where: { id, userId: user.id },
    include: { messages: { orderBy: { createdAt: "asc" } }, order: { select: { id: true, number: true } } },
  });
  if (!convo) notFound();
  if (convo.customerUnread) await db.conversation.update({ where: { id }, data: { customerUnread: false } });
  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/account/support" className="text-sm text-text-muted hover:text-text">← All messages</Link>
        <h2 className="font-heading text-lg text-text">{convo.subject}</h2>
        {convo.order && (
          <Link href={`/account/orders/${convo.order.id}`} className="text-sm text-molten underline underline-offset-4">
            {orderLabel(convo.order.number)}
          </Link>
        )}
      </div>
      <ChatThread
        conversationId={convo.id}
        as="CUSTOMER"
        closed={convo.status === "CLOSED"}
        initial={convo.messages.map((m) => ({ id: m.id, sender: m.sender, body: m.body, attachments: m.attachments, createdAt: m.createdAt.toISOString() }))}
      />
    </div>
  );
}
