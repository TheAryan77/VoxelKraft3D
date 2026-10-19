"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { IconMinus, IconPlus, IconTrash } from "@tabler/icons-react";
import { cart, cartSubtotal, useCart } from "@/lib/shop/cart";
import { formatPrice } from "@/lib/shop/money";
import { shippingFor, shopConfig } from "@/lib/shop/config";
import { getCartStock, type StockInfo } from "@/lib/shop/actions/cart";
import { ButtonLink, Card, EmptyState } from "@/components/shop/ui";
import { cn } from "@/lib/utils";

export function CartView() {
  const items = useCart();
  const subtotal = cartSubtotal(items);
  const shipping = shippingFor(subtotal);
  const stock = useCartStock(items.map((i) => i.productId));

  /** Problem with a line, if any: gone, out of stock, or more than what's left. */
  const issue = (productId: string) => {
    const s = stock?.[productId];
    if (!stock) return null;
    if (!s || !s.available) return { kind: "gone" as const, text: "No longer available. Remove it to check out." };
    if (s.stock === null) return null;
    const inCart = items.filter((i) => i.productId === productId).reduce((n, i) => n + i.quantity, 0);
    if (s.stock <= 0) return { kind: "out" as const, text: "Out of stock. Remove it to check out." };
    if (inCart > s.stock) return { kind: "low" as const, text: `Only ${s.stock} left. Lower the quantity to check out.` };
    return null;
  };
  const blocked = items.some((i) => issue(i.productId));

  if (!items.length) {
    return <EmptyState title="Your cart is empty" body="Browse the shop and add a few prints." action={<ButtonLink href="/shop">Go to the shop</ButtonLink>} />;
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
      <ul className="flex flex-col gap-3 lg:col-span-8">
        {items.map((item) => {
          const problem = issue(item.productId);
          const left = stock?.[item.productId]?.stock;
          const atMax = item.quantity >= shopConfig.maxQuantityPerItem || (left != null && item.quantity >= left);
          return (
          <li key={`${item.productId}-${item.color ?? ""}`}>
            <Card className={cn("flex gap-4 p-3 md:p-4", problem && "border-error/50")}>
              <Link href={`/product/${item.slug}`} className="relative h-24 w-24 shrink-0 overflow-hidden rounded-[12px] bg-surface-2">
                {item.image && <Image src={item.image} alt={item.name} fill sizes="96px" className={cn("object-cover", problem && problem.kind !== "low" && "opacity-50 grayscale")} />}
              </Link>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <Link href={`/product/${item.slug}`} className="font-heading text-base text-text hover:underline">
                  {item.name}
                </Link>
                {item.color && <p className="text-xs text-text-muted">Colour: {item.color}</p>}
                <p className="font-machine text-sm text-text">{formatPrice(item.price)}</p>
                {problem && <p className="text-xs text-error">{problem.text}</p>}
                <div className="mt-auto flex items-center justify-between gap-3 pt-2">
                  <div className="flex h-9 items-center rounded-full border border-line">
                    <button type="button" aria-label="Decrease quantity" onClick={() => cart.setQuantity(item.productId, item.color, item.quantity - 1)} className="grid h-9 w-9 place-items-center text-text-muted hover:text-text">
                      <IconMinus size={14} />
                    </button>
                    <span className="w-6 text-center font-machine text-sm">{item.quantity}</span>
                    <button
                      type="button"
                      aria-label="Increase quantity"
                      disabled={atMax}
                      onClick={() => cart.setQuantity(item.productId, item.color, item.quantity + 1)}
                      className="grid h-9 w-9 place-items-center text-text-muted hover:text-text disabled:opacity-40"
                    >
                      <IconPlus size={14} />
                    </button>
                  </div>
                  <button type="button" onClick={() => cart.remove(item.productId, item.color)} className="flex items-center gap-1 text-xs text-text-muted hover:text-error">
                    <IconTrash size={14} /> Remove
                  </button>
                </div>
              </div>
            </Card>
          </li>
          );
        })}
      </ul>

      <aside className="lg:col-span-4">
        <Card className="flex flex-col gap-3 lg:sticky lg:top-28">
          <h2 className="font-heading text-lg text-text">Summary</h2>
          <Row label="Subtotal" value={formatPrice(subtotal)} />
          <Row label="Shipping" value={shipping === 0 ? "Free" : formatPrice(shipping)} />
          {shipping > 0 && <p className="text-xs text-text-muted">Add {formatPrice(shopConfig.freeShippingFrom - subtotal)} more for free shipping.</p>}
          <div className="border-t border-line pt-3">
            <Row label="Total" value={formatPrice(subtotal + shipping)} strong />
          </div>
          <ButtonLink
            href="/checkout"
            aria-disabled={blocked}
            onClick={(e) => blocked && e.preventDefault()}
            className={cn("mt-2 h-12 w-full", blocked && "pointer-events-none opacity-50")}
          >
            Checkout
          </ButtonLink>
          {blocked && <p className="text-xs text-error">Fix the items marked above to check out.</p>}
          <p className="text-xs text-text-muted">Final prices are confirmed at checkout.</p>
        </Card>
      </aside>
    </div>
  );
}

/** Live stock for the cart's products; null until loaded (or if the check fails). */
function useCartStock(productIds: string[]) {
  const key = [...new Set(productIds)].sort().join(",");
  const [stock, setStock] = useState<StockInfo | null>(null);
  useEffect(() => {
    if (!key) return;
    let live = true;
    getCartStock(key.split(","))
      .then((s) => live && setStock(s))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [key]);
  return stock;
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between text-sm">
      <span className="text-text-muted">{label}</span>
      <span className={strong ? "font-machine text-lg text-text" : "font-machine text-text"}>{value}</span>
    </div>
  );
}
