"use client";

import Image from "next/image";
import Link from "next/link";
import { IconMinus, IconPlus, IconTrash } from "@tabler/icons-react";
import { cart, cartSubtotal, useCart } from "@/lib/shop/cart";
import { formatPrice } from "@/lib/shop/money";
import { shippingFor, shopConfig } from "@/lib/shop/config";
import { ButtonLink, Card, EmptyState } from "@/components/shop/ui";

export function CartView() {
  const items = useCart();
  const subtotal = cartSubtotal(items);
  const shipping = shippingFor(subtotal);

  if (!items.length) {
    return <EmptyState title="Your cart is empty" body="Browse the shop and add a few prints." action={<ButtonLink href="/shop">Go to the shop</ButtonLink>} />;
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
      <ul className="flex flex-col gap-3 lg:col-span-8">
        {items.map((item) => (
          <li key={`${item.productId}-${item.color ?? ""}`}>
            <Card className="flex gap-4 p-3 md:p-4">
              <Link href={`/product/${item.slug}`} className="relative h-24 w-24 shrink-0 overflow-hidden rounded-[12px] bg-surface-2">
                {item.image && <Image src={item.image} alt={item.name} fill sizes="96px" className="object-cover" />}
              </Link>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <Link href={`/product/${item.slug}`} className="font-heading text-base text-text hover:underline">
                  {item.name}
                </Link>
                {item.color && <p className="text-xs text-text-muted">Colour: {item.color}</p>}
                <p className="font-machine text-sm text-text">{formatPrice(item.price)}</p>
                <div className="mt-auto flex items-center justify-between gap-3 pt-2">
                  <div className="flex h-9 items-center rounded-full border border-line">
                    <button type="button" aria-label="Decrease quantity" onClick={() => cart.setQuantity(item.productId, item.color, item.quantity - 1)} className="grid h-9 w-9 place-items-center text-text-muted hover:text-text">
                      <IconMinus size={14} />
                    </button>
                    <span className="w-6 text-center font-machine text-sm">{item.quantity}</span>
                    <button
                      type="button"
                      aria-label="Increase quantity"
                      disabled={item.quantity >= shopConfig.maxQuantityPerItem}
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
        ))}
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
          <ButtonLink href="/checkout" className="mt-2 h-12 w-full">
            Checkout
          </ButtonLink>
          <p className="text-xs text-text-muted">Final prices are confirmed at checkout.</p>
        </Card>
      </aside>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between text-sm">
      <span className="text-text-muted">{label}</span>
      <span className={strong ? "font-machine text-lg text-text" : "font-machine text-text"}>{value}</span>
    </div>
  );
}
