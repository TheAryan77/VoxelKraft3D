import { cn } from "@/lib/utils";

/** Left-aligned section heading with an optional one-line sub. */
export function SectionHeading({ id, title, sub, className }: { id: string; title: string; sub?: string; className?: string }) {
  return (
    <div className={cn("mb-12 md:mb-16", className)}>
      <h2 id={id} className="font-heading text-[length:var(--text-heading)] text-text">
        {title}
      </h2>
      {sub && <p className="prose-body mt-4 text-lg text-text-muted">{sub}</p>}
    </div>
  );
}
