import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/shop/session";
import { orderLabel } from "@/lib/shop/config";
import { ButtonLink, Card, EmptyState, Pill } from "@/components/shop/ui";

export const metadata: Metadata = { title: "Help & chat" };

const when = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

export default async function SupportPage() {
  const user = await requireUser("/account/support");
  const convos = await db.conversation.findMany({
    where: { userId: user.id },
    orderBy: { lastMessageAt: "desc" },
    include: { order: { select: { number: true } }, messages: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-text-muted">Questions about an order, a custom print or anything else. We usually reply within a few hours.</p>
        <ButtonLink href="/account/support/new">New message</ButtonLink>
      </div>
      {convos.length === 0 ? (
        <EmptyState title="No conversations yet" body="Start one and we'll reply here." />
      ) : (
        <ul className="flex flex-col gap-3">
          {convos.map((c) => (
            <li key={c.id}>
              <Link href={`/account/support/${c.id}`}>
                <Card className="flex items-center justify-between gap-4 transition-colors hover:border-pei/40">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-sm text-text">
                      {c.customerUnread && <span className="h-2 w-2 shrink-0 rounded-full bg-molten" aria-label="New reply" />}
                      <span className="truncate">{c.subject}</span>
                      {c.order && <Pill>{orderLabel(c.order.number)}</Pill>}
                    </p>
                    <p className="truncate text-xs text-text-muted">{c.messages[0]?.body}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="text-[11px] text-text-muted">{when.format(c.lastMessageAt)}</span>
                    {c.status === "CLOSED" && <Pill>Closed</Pill>}
                  </div>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
