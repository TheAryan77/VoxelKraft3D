"use client";

import { useSyncExternalStore } from "react";
import { createStore } from "@/lib/store";
import { shopConfig } from "./config";

/**
 * The cart lives in the browser (localStorage). Prices here are only for
 * display; the server re-reads every price from the database at checkout.
 */
export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  image?: string;
  price: number; // paise, display only
  color?: string;
  quantity: number;
}

const KEY = "vk-cart";
const cartStore = createStore<CartItem[]>([]);
let loaded = false;

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) cartStore.set(JSON.parse(raw) as CartItem[]);
  } catch {
    // Storage blocked or corrupt: start empty.
  }
  window.addEventListener("storage", (e) => {
    if (e.key === KEY) {
      try {
        cartStore.set(e.newValue ? (JSON.parse(e.newValue) as CartItem[]) : []);
      } catch {}
    }
  });
}

function save(items: CartItem[]) {
  cartStore.set(items);
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {}
}

const sameLine = (a: CartItem, productId: string, color?: string) => a.productId === productId && (a.color ?? "") === (color ?? "");

export const cart = {
  add(item: Omit<CartItem, "quantity">, quantity = 1) {
    load();
    const items = [...cartStore.get()];
    const i = items.findIndex((x) => sameLine(x, item.productId, item.color));
    if (i >= 0) items[i] = { ...items[i], quantity: Math.min(shopConfig.maxQuantityPerItem, items[i].quantity + quantity) };
    else items.push({ ...item, quantity: Math.min(shopConfig.maxQuantityPerItem, quantity) });
    save(items);
  },
  setQuantity(productId: string, color: string | undefined, quantity: number) {
    load();
    const q = Math.max(0, Math.min(shopConfig.maxQuantityPerItem, Math.round(quantity)));
    save(
      cartStore
        .get()
        .map((x) => (sameLine(x, productId, color) ? { ...x, quantity: q } : x))
        .filter((x) => x.quantity > 0),
    );
  },
  remove(productId: string, color?: string) {
    load();
    save(cartStore.get().filter((x) => !sameLine(x, productId, color)));
  },
  clear() {
    save([]);
  },
};

const EMPTY: CartItem[] = [];

/** Cart contents; empty during server render and hydration. */
export function useCart() {
  return useSyncExternalStore(
    (cb) => {
      load();
      return cartStore.subscribe(cb);
    },
    () => {
      load();
      return cartStore.get();
    },
    () => EMPTY,
  );
}

export function cartCount(items: CartItem[]) {
  return items.reduce((n, i) => n + i.quantity, 0);
}

export function cartSubtotal(items: CartItem[]) {
  return items.reduce((n, i) => n + i.price * i.quantity, 0);
}
