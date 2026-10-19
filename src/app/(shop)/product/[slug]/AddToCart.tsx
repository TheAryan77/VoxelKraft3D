"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconMinus, IconPlus, IconCheck } from "@tabler/icons-react";
import { cart, type CartItem } from "@/lib/shop/cart";
import { shopConfig } from "@/lib/shop/config";
import { Button } from "@/components/shop/ui";
import { cn } from "@/lib/utils";

export function AddToCart({
  product,
  colors,
  soldOut,
  maxQuantity = shopConfig.maxQuantityPerItem,
}: {
  product: Omit<CartItem, "quantity" | "color">;
  colors: string[];
  soldOut: boolean;
  /** Stock left (capped at the per-item limit). */
  maxQuantity?: number;
}) {
  const router = useRouter();
  const [color, setColor] = useState(colors[0]);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const add = () => {
    cart.add({ ...product, color }, qty);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  };

  return (
    <div className="flex flex-col gap-5">
      {colors.length > 0 && (
        <fieldset>
          <legend className="mb-2 text-sm text-text-muted">
            Colour: <span className="text-text">{color}</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {colors.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                aria-pressed={color === c}
                className={cn(
                  "h-9 rounded-full border px-4 text-sm transition-colors",
                  color === c ? "border-molten text-text" : "border-line text-text-muted hover:border-pei/50",
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <div className="flex h-11 items-center rounded-full border border-line">
          <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease quantity" className="grid h-11 w-11 place-items-center text-text-muted hover:text-text">
            <IconMinus size={16} />
          </button>
          <span className="w-8 text-center font-machine text-sm" aria-live="polite">{qty}</span>
          <button
            type="button"
            onClick={() => setQty((q) => Math.min(maxQuantity, q + 1))}
            disabled={soldOut || qty >= maxQuantity}
            aria-label="Increase quantity"
            className="grid h-11 w-11 place-items-center text-text-muted hover:text-text disabled:opacity-40"
          >
            <IconPlus size={16} />
          </button>
        </div>
        <Button variant="outline" onClick={add} disabled={soldOut} className="flex-1 whitespace-nowrap px-4 sm:flex-none sm:px-6">
          {added ? (
            <>
              <IconCheck size={16} /> Added
            </>
          ) : soldOut ? (
            "Out of stock"
          ) : (
            "Add to cart"
          )}
        </Button>
        <Button
          onClick={() => {
            cart.add({ ...product, color }, qty);
            router.push("/cart");
          }}
          disabled={soldOut}
          className="flex-1 whitespace-nowrap px-4 sm:flex-none sm:px-6"
        >
          Buy now
        </Button>
      </div>
    </div>
  );
}
