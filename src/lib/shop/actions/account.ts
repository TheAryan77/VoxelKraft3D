"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { assertUser } from "@/lib/shop/session";
import { addressSchema, type AddressInput } from "@/lib/shop/address";

type Result = { ok: true } | { ok: false; error: string };

export async function saveAddress(input: AddressInput & { id?: string }): Promise<Result> {
  const user = await assertUser();
  const parsed = addressSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the address" };
  const data = { ...parsed.data, line2: parsed.data.line2 || null };
  if (input.id) {
    const owned = await db.address.findFirst({ where: { id: input.id, userId: user.id } });
    if (!owned) return { ok: false, error: "Address not found" };
    await db.address.update({ where: { id: input.id }, data });
  } else {
    const count = await db.address.count({ where: { userId: user.id } });
    await db.address.create({ data: { ...data, userId: user.id, isDefault: count === 0 } });
  }
  revalidatePath("/account/addresses");
  return { ok: true };
}

export async function deleteAddress(id: string): Promise<Result> {
  const user = await assertUser();
  const address = await db.address.findFirst({ where: { id, userId: user.id } });
  if (!address) return { ok: false, error: "Address not found" };
  await db.address.delete({ where: { id } });
  if (address.isDefault) {
    const next = await db.address.findFirst({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
    if (next) await db.address.update({ where: { id: next.id }, data: { isDefault: true } });
  }
  revalidatePath("/account/addresses");
  return { ok: true };
}

export async function setDefaultAddress(id: string): Promise<Result> {
  const user = await assertUser();
  const address = await db.address.findFirst({ where: { id, userId: user.id } });
  if (!address) return { ok: false, error: "Address not found" };
  await db.$transaction([
    db.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } }),
    db.address.update({ where: { id }, data: { isDefault: true } }),
  ]);
  revalidatePath("/account/addresses");
  return { ok: true };
}

const profileSchema = z.object({
  name: z.string().trim().min(1, "Enter your name").max(80),
  phone: z
    .string()
    .trim()
    .transform((v) => v.replace(/[\s-]/g, ""))
    .refine((v) => v === "" || /^(\+91)?[6-9]\d{9}$/.test(v), "Enter a 10-digit Indian mobile number"),
});

export async function updateProfile(input: { name: string; phone: string }): Promise<Result> {
  const user = await assertUser();
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check your details" };
  await db.user.update({ where: { id: user.id }, data: { name: parsed.data.name, phone: parsed.data.phone || null } });
  revalidatePath("/account");
  return { ok: true };
}

/** Customers can cancel until the order goes into printing. */
export async function cancelOrder(orderId: string): Promise<Result> {
  const user = await assertUser();
  const order = await db.order.findFirst({ where: { id: orderId, userId: user.id }, include: { items: true } });
  if (!order) return { ok: false, error: "Order not found" };
  if (!["PENDING_PAYMENT", "PLACED", "CONFIRMED"].includes(order.status)) return { ok: false, error: "This order is already being printed. Message us and we'll help." };
  await restockAndCancel(order.id, order.items, "Cancelled by customer.");
  revalidatePath(`/account/orders/${orderId}`);
  return { ok: true };
}

async function restockAndCancel(orderId: string, items: { productId: string | null; quantity: number }[], note: string) {
  await db.$transaction(async (tx) => {
    for (const i of items) {
      if (!i.productId) continue;
      await tx.product.updateMany({ where: { id: i.productId, stock: { not: null } }, data: { stock: { increment: i.quantity } } });
    }
    await tx.order.update({ where: { id: orderId }, data: { status: "CANCELLED", events: { create: { status: "CANCELLED", note } } } });
  });
}
