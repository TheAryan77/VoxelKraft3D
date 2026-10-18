import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { requireAdmin } from "@/lib/shop/session";
import { db } from "@/lib/db";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { AdminNav } from "./AdminNav";

export const metadata: Metadata = { title: { default: "Admin", template: "%s | Voxel Kraft admin" }, robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await requireAdmin();
  const [newOrders, unreadChats] = await Promise.all([
    db.order.count({ where: { status: "PLACED" } }),
    db.conversation.count({ where: { adminUnread: true, status: "OPEN" } }),
  ]);
  return (
    // Native cursor in admin: the playful pointer gets in the way of real work.
    <div data-cursor="native" className="min-h-screen md:grid md:grid-cols-[232px_1fr]">
      <aside className="z-40 border-b border-line bg-surface md:sticky md:top-0 md:h-screen md:border-b-0 md:border-r">
        <div className="flex items-center justify-between px-5 py-4 md:py-6">
          <Link href="/admin" className="font-heading text-base text-text">
            Voxel Kraft <span className="text-text-muted">admin</span>
          </Link>
          <ThemeToggle className="h-9 w-9 md:hidden" />
        </div>
        <AdminNav badges={{ orders: newOrders, support: unreadChats }} />
        <div className="hidden px-5 py-6 text-xs text-text-muted md:absolute md:bottom-0 md:block">
          <p className="truncate">{user.email}</p>
          <div className="mt-3 flex items-center gap-3">
            <Link href="/" className="underline underline-offset-4 hover:text-text">View site</Link>
            <ThemeToggle className="h-9 w-9" placement="above" />
          </div>
        </div>
      </aside>
      <main id="main" className="min-w-0 px-5 py-8 md:px-10 md:py-10">{children}</main>
    </div>
  );
}
