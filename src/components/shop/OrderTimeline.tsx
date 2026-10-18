import type { OrderStatus } from "@prisma/client";
import { ORDER_FLOW, ORDER_STATUS_LABEL } from "@/lib/shop/status";
import { cn } from "@/lib/utils";

const when = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

/** Progress steps plus the dated history of updates. */
export function OrderTimeline({ status, events }: { status: OrderStatus; events: { id: string; status: OrderStatus | null; note: string | null; createdAt: Date }[] }) {
  const reached = ORDER_FLOW.indexOf(status);
  return (
    <div className="flex flex-col gap-8">
      {status !== "CANCELLED" && status !== "PENDING_PAYMENT" && (
        <ol className="grid grid-cols-5 gap-1" aria-label="Order progress">
          {ORDER_FLOW.map((s, i) => (
            <li key={s} className="flex flex-col gap-2">
              <span className={cn("h-1.5 rounded-full", i <= reached ? "bg-molten" : "bg-line")} />
              <span className={cn("text-[11px] leading-tight md:text-xs", i <= reached ? "text-text" : "text-text-muted")} aria-current={i === reached ? "step" : undefined}>
                {ORDER_STATUS_LABEL[s]}
              </span>
            </li>
          ))}
        </ol>
      )}
      <ol className="relative flex flex-col gap-5 border-l border-line pl-5">
        {[...events].reverse().map((e, i) => (
          <li key={e.id} className="relative">
            <span className={cn("absolute -left-[25px] top-1.5 h-2 w-2 rounded-full", i === 0 ? "bg-molten" : "bg-line")} />
            <p className="text-sm text-text">{e.status ? ORDER_STATUS_LABEL[e.status] : "Update"}</p>
            {e.note && <p className="text-sm text-text-muted">{e.note}</p>}
            <p className="font-machine text-[11px] text-text-muted">{when.format(e.createdAt)}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
