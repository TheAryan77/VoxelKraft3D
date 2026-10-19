"use server";

import { z } from "zod";
import { db } from "@/lib/db";

export type StockInfo = Record<string, { available: boolean; stock: number | null }>;

/** Live stock for the products in a cart (public: it's the same as what product pages show). */
export async function getCartStock(productIds: string[]): Promise<StockInfo> {
  const ids = z.array(z.string().min(1).max(40)).max(50).safeParse(productIds);
  if (!ids.success || !ids.data.length) return {};
  const products = await db.product.findMany({
    where: { id: { in: ids.data } },
    select: { id: true, stock: true, isActive: true, category: { select: { isActive: true } } },
  });
  return Object.fromEntries(products.map((p) => [p.id, { available: p.isActive && p.category.isActive, stock: p.stock }]));
}
