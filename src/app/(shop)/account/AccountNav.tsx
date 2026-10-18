"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/account", label: "Overview" },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/addresses", label: "Addresses" },
  { href: "/account/support", label: "Help & chat" },
];

export function AccountNav() {
  const path = usePathname();
  return (
    <nav aria-label="Account" className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto border-b border-line px-5 md:mx-0 md:px-0">
      {links.map((l) => {
        const active = l.href === "/account" ? path === l.href : path.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={cn("-mb-px shrink-0 border-b-2 px-3 pb-3 text-sm transition-colors", active ? "border-molten text-text" : "border-transparent text-text-muted hover:text-text")}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
