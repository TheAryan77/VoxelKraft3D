import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { orderLabel } from "@/lib/shop/config";
import { formatPrice } from "@/lib/shop/money";
import { ChatThread } from "@/components/shop/ChatThread";
import { Card, StatusBadge } from "@/components/shop/ui";
import { CloseToggle } from "./CloseToggle";

export default async function AdminConversation({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const convo = await db.conversation.findUnique({
    where: { id },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
      user: { select: { name: true, email: true, phone: true } },
      order: { select: { id: true, number: true, status: true, total: true } },
    },
  });
  if (!convo) notFound();
  if (convo.adminUnread) await db.conversation.update({ where: { id }, data: { adminUnread: false } });
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
      <div className="flex flex-col gap-4 xl:col-span-8">
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/admin/support" className="text-sm text-text-muted hover:text-text">← Customer care</Link>
          <h1 className="font-heading text-xl text-text">{convo.subject}</h1>
          <CloseToggle id={convo.id} status={convo.status} />
        </div>
        <ChatThread
          conversationId={convo.id}
          as="ADMIN"
          closed={convo.status === "CLOSED"}
          initial={convo.messages.map((m) => ({ id: m.id, sender: m.sender, body: m.body, createdAt: m.createdAt.toISOString() }))}
        />
      </div>
      <div className="flex flex-col gap-4 xl:col-span-4">
        <Card className="flex flex-col gap-1 text-sm">
          <h2 className="mb-2 font-heading text-lg text-text">Customer</h2>
          <p className="text-text">{convo.user.name ?? "—"}</p>
          <a href={`mailto:${convo.user.email}`} className="text-text-muted hover:text-text">{convo.user.email}</a>
          {convo.user.phone && (
            <a href={`https://wa.me/${convo.user.phone.replace(/\D/g, "").replace(/^(?!91)(\d{10})$/, "91$1")}`} target="_blank" rel="noopener noreferrer" className="text-molten underline-offset-4 hover:underline">
              WhatsApp {convo.user.phone}
            </a>
          )}
        </Card>
        {convo.order && (
          <Link href={`/admin/orders/${convo.order.id}`}>
            <Card className="flex items-center justify-between gap-3 transition-colors hover:border-pei/40">
              <div>
                <p className="font-machine text-sm text-text">{orderLabel(convo.order.number)}</p>
                <p className="font-machine text-xs text-text-muted">{formatPrice(convo.order.total)}</p>
              </div>
              <StatusBadge status={convo.order.status} />
            </Card>
          </Link>
        )}
      </div>
    </div>
  );
}
