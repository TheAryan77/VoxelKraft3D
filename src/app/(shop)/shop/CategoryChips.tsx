import Link from "next/link";
import { cn } from "@/lib/utils";

export function CategoryChips({ categories, active }: { categories: { slug: string; name: string }[]; active?: string }) {
  const chip = (on: boolean) =>
    cn(
      "inline-flex h-9 shrink-0 items-center rounded-full border px-4 text-sm transition-colors",
      on ? "border-molten bg-molten text-on-molten" : "border-line text-text-muted hover:border-pei/50 hover:text-text",
    );
  return (
    <nav aria-label="Categories" className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 md:mx-0 md:flex-wrap md:px-0">
      <Link href="/shop" className={chip(!active)} aria-current={!active ? "page" : undefined}>
        All
      </Link>
      {categories.map((c) => (
        <Link key={c.slug} href={`/shop/${c.slug}`} className={chip(active === c.slug)} aria-current={active === c.slug ? "page" : undefined}>
          {c.name}
        </Link>
      ))}
    </nav>
  );
}
