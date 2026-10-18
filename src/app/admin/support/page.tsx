import Link from "next/link";
import { db } from "@/lib/db";
import { orderLabel } from "@/lib/shop/config";
import { Card, Pill } from "@/components/shop/ui";
import { cn } from "@/lib/utils";

const when = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

export default async function AdminSupport({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const { view = "open" } = await searchParams;
  const convos = await db.conversation.findMany({
    where: { status: view === "closed" ? "CLOSED" : "OPEN" },
    orderBy: [{ adminUnread: "desc" }, { lastMessageAt: "desc" }],
    take: 100,
    include: {
      user: { select: { name: true, email: true } },
      order: { select: { number: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-heading text-3xl text-text">Customer care</h1>
      <nav className="flex gap-2" aria-label="Filter conversations">
        {["open", "closed"].map((v) => (
          <Link key={v} href={`/admin/support?view=${v}`} className={cn("rounded-full border px-4 py-1.5 text-sm capitalize", view === v ? "border-molten bg-molten text-on-molten" : "border-line text-text-muted hover:text-text")}>
            {v}
          </Link>
        ))}
      </nav>
      {convos.length === 0 ? (
        <Card className="text-sm text-text-muted">No {view} conversations.</Card>
      ) : (
        <ul className="flex flex-col gap-2">
          {convos.map((c) => (
            <li key={c.id}>
              <Link href={`/admin/support/${c.id}`}>
                <Card className={cn("flex items-center justify-between gap-4 p-4 transition-colors hover:border-pei/40 md:p-4", c.adminUnread && "border-molten/50")}>
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-sm text-text">
                      {c.adminUnread && <span className="h-2 w-2 shrink-0 rounded-full bg-molten" aria-label="Unread" />}
                      <span className="truncate">{c.subject}</span>
                      {c.order && <Pill>{orderLabel(c.order.number)}</Pill>}
                    </p>
                    <p className="truncate text-xs text-text-muted">
                      {c.user.name ?? c.user.email} · {c.messages[0]?.sender === "ADMIN" ? "You: " : ""}
                      {c.messages[0]?.body}
                    </p>
                  </div>
                  <span className="shrink-0 text-[11px] text-text-muted">{when.format(c.lastMessageAt)}</span>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
