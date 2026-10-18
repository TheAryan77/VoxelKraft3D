"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { IconShoppingBag, IconUser, IconLayoutDashboard } from "@tabler/icons-react";
import { cartCount, useCart } from "@/lib/shop/cart";
import { nav } from "@/content/site";
import { cn } from "@/lib/utils";

const iconButton =
  "relative grid h-11 w-11 shrink-0 place-items-center rounded-full border border-line text-text-muted transition-[color,border-color,transform] duration-200 hover:border-pei/50 hover:text-text active:scale-[0.97]";

export function CartButton({ className }: { className?: string }) {
  const count = cartCount(useCart());
  return (
    <Link href="/cart" aria-label={nav.cartCount(count)} title={nav.cart} className={cn(iconButton, className)}>
      <IconShoppingBag size={18} stroke={1.5} aria-hidden />
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-molten px-1 text-[10px] font-semibold text-on-molten">
          {count}
        </span>
      )}
    </Link>
  );
}

export function AccountButton({ className }: { className?: string }) {
  const { data } = useSession();
  const user = data?.user;
  const label = user ? nav.account : nav.signIn;
  return (
    <>
      {user?.role === "ADMIN" && (
        <Link href="/admin" aria-label={nav.admin} title={nav.admin} className={cn(iconButton, className)}>
          <IconLayoutDashboard size={18} stroke={1.5} aria-hidden />
        </Link>
      )}
      <Link href={user ? "/account" : "/login"} aria-label={label} title={label} className={cn(iconButton, "overflow-hidden", className)}>
        {user?.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.image} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
        ) : user ? (
          <span className="font-heading text-sm text-text">{(user.name ?? user.email ?? "?").slice(0, 1).toUpperCase()}</span>
        ) : (
          <IconUser size={18} stroke={1.5} aria-hidden />
        )}
      </Link>
    </>
  );
}
