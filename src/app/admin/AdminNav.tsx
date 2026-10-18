"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconBox, IconCategory, IconLayoutDashboard, IconMessages, IconReceipt, IconUsers } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Dashboard", Icon: IconLayoutDashboard },
  { href: "/admin/orders", label: "Orders", Icon: IconReceipt, badge: "orders" as const },
  { href: "/admin/products", label: "Products", Icon: IconBox },
  { href: "/admin/categories", label: "Categories", Icon: IconCategory },
  { href: "/admin/support", label: "Customer care", Icon: IconMessages, badge: "support" as const },
  { href: "/admin/customers", label: "Customers", Icon: IconUsers },
];

export function AdminNav({ badges }: { badges: { orders: number; support: number } }) {
  const path = usePathname();
  return (
    <nav aria-label="Admin" className="no-scrollbar flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:px-3">
      {links.map(({ href, label, Icon, badge }) => {
        const active = href === "/admin" ? path === href : path.startsWith(href);
        const count = badge ? badges[badge] : 0;
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-3 rounded-[12px] px-3 py-2.5 text-sm transition-colors",
              active ? "bg-surface-2 text-text" : "text-text-muted hover:bg-surface-2/60 hover:text-text",
            )}
          >
            <Icon size={18} stroke={1.5} aria-hidden />
            {label}
            {count > 0 && <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-molten px-1.5 text-[10px] font-semibold text-on-molten">{count}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
