"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { assertUser } from "@/lib/shop/session";
import { addressSchema } from "@/lib/shop/address";
import { orderLabel, shippingFor, shopConfig } from "@/lib/shop/config";
import { createRazorpayOrder, razorpayEnabled, razorpayKeyId, verifyPaymentSignature } from "@/lib/shop/razorpay";
import { notifyAdmin } from "@/lib/shop/notify";
import { markRazorpayPaid, syncRazorpayPayment } from "@/lib/shop/payments";

const placeOrderSchema = z.object({
  items: z
    .array(z.object({ productId: z.string().min(1), color: z.string().max(60).optional(), quantity: z.number().int().min(1).max(shopConfig.maxQuantityPerItem) }))
    .min(1, "Your cart is empty")
    .max(50),
  addressId: z.string().optional(),
  newAddress: addressSchema.optional(),
  saveAddress: z.boolean().optional(),
  paymentMethod: z.enum(["RAZORPAY", "COD"]),
  note: z.string().trim().max(500).optional(),
});

export type PlaceOrderResult =
  | { ok: true; orderId: string; razorpay?: { keyId: string; orderId: string; amount: number; label: string; contact: string } }
  | { ok: false; error: string };

/** Razorpay wants the mobile with country code; prefilling it skips its "Contact details" step. */
const razorpayContact = (phone: string) => `+91${phone.replace(/\D/g, "").slice(-10)}`;

export async function placeOrder(input: z.input<typeof placeOrderSchema>): Promise<PlaceOrderResult> {
  const user = await assertUser();
  const parsed = placeOrderSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check your details" };
  const { items, addressId, newAddress, saveAddress, paymentMethod, note } = parsed.data;

  // Address: a saved one that belongs to this user, or a new one.
  let address;
  if (addressId) {
    address = await db.address.findFirst({ where: { id: addressId, userId: user.id } });
    if (!address) return { ok: false, error: "Pick a delivery address" };
  } else if (newAddress) {
    address = { ...newAddress, line2: newAddress.line2 || null };
    if (saveAddress) {
      const count = await db.address.count({ where: { userId: user.id } });
      await db.address.create({ data: { ...address, userId: user.id, isDefault: count === 0 } });
    }
  } else {
    return { ok: false, error: "Add a delivery address" };
  }

  // Prices always come from the database, never from the browser.
  const products = await db.product.findMany({ where: { id: { in: items.map((i) => i.productId) }, isActive: true } });
  const byId = new Map(products.map((p) => [p.id, p]));
  const lines: { product: (typeof products)[number]; quantity: number; color: string | null }[] = [];
  for (const item of items) {
    const p = byId.get(item.productId);
    if (!p) return { ok: false, error: "Something in your cart is no longer available. Please review your cart." };
    if (item.color && p.colors.length && !p.colors.includes(item.color)) return { ok: false, error: `Pick a colour for ${p.name} again.` };
    lines.push({ product: p, quantity: item.quantity, color: item.color ?? null });
  }
  // Stock check across duplicate lines (same product, different colours).
  const wanted = new Map<string, number>();
  for (const l of lines) wanted.set(l.product.id, (wanted.get(l.product.id) ?? 0) + l.quantity);
  for (const [id, qty] of wanted) {
    const p = byId.get(id)!;
    if (p.stock !== null && p.stock < qty) return { ok: false, error: `Only ${p.stock} of ${p.name} left.` };
  }

  const subtotal = lines.reduce((n, l) => n + l.product.price * l.quantity, 0);
  const shipping = shippingFor(subtotal);
  const total = subtotal + shipping;

  if (paymentMethod === "RAZORPAY" && !razorpayEnabled) return { ok: false, error: "Online payment isn't available right now. Choose cash on delivery." };
  if (paymentMethod === "COD" && total > shopConfig.codMaxTotal) return { ok: false, error: "Cash on delivery isn't available for orders this large. Please pay online." };

  const order = await db.$transaction(async (tx) => {
    for (const [id, qty] of wanted) {
      const p = byId.get(id)!;
      if (p.stock !== null) {
        const updated = await tx.product.updateMany({ where: { id, stock: { gte: qty } }, data: { stock: { decrement: qty } } });
        if (updated.count === 0) throw new Error(`Only a few of ${p.name} left. Please review your cart.`);
      }
    }
    return tx.order.create({
      data: {
        userId: user.id,
        status: paymentMethod === "COD" ? "PLACED" : "PENDING_PAYMENT",
        paymentMethod,
        subtotal,
        shipping,
        total,
        shipName: address.fullName,
        shipPhone: address.phone,
        shipLine1: address.line1,
        shipLine2: address.line2,
        shipCity: address.city,
        shipState: address.state,
        shipPincode: address.pincode,
        customerNote: note || null,
        items: {
          create: lines.map((l) => ({
            productId: l.product.id,
            name: l.product.name,
            image: l.product.images[0] ?? null,
            color: l.color,
            unitPrice: l.product.price,
            quantity: l.quantity,
          })),
        },
        events: { create: { status: paymentMethod === "COD" ? "PLACED" : "PENDING_PAYMENT", note: paymentMethod === "COD" ? "Order placed (cash on delivery)." : "Waiting for payment." } },
      },
    });
  }).catch((e: Error) => e);
  if (order instanceof Error) return { ok: false, error: order.message };

  if (paymentMethod === "COD") {
    await notifyAdmin(`New order ${orderLabel(order.number)} (COD)`, `Total ${total / 100} INR. Open /admin/orders/${order.id}`);
    return { ok: true, orderId: order.id };
  }

  try {
    const rp = await createRazorpayOrder(total, orderLabel(order.number));
    await db.order.update({ where: { id: order.id }, data: { razorpayOrderId: rp.id } });
    return { ok: true, orderId: order.id, razorpay: { keyId: razorpayKeyId, orderId: rp.id, amount: total, label: orderLabel(order.number), contact: razorpayContact(address.phone) } };
  } catch (err) {
    console.error("[checkout] razorpay order failed", err);
    return { ok: false, error: "Couldn't start the payment. Please try again or choose cash on delivery." };
  }
}

export async function confirmRazorpayPayment(input: { orderId: string; razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }) {
  const user = await assertUser();
  const order = await db.order.findFirst({ where: { id: input.orderId, userId: user.id } });
  if (!order || order.razorpayOrderId !== input.razorpayOrderId) return { ok: false as const, error: "Order not found" };
  if (!verifyPaymentSignature(input.razorpayOrderId, input.razorpayPaymentId, input.razorpaySignature)) {
    await db.order.update({ where: { id: order.id }, data: { paymentStatus: "FAILED", events: { create: { note: "Payment could not be verified." } } } });
    return { ok: false as const, error: "We couldn't verify the payment. If money was taken, contact us and we'll sort it out." };
  }
  await markRazorpayPaid(input.razorpayOrderId, input.razorpayPaymentId, "checkout");
  return { ok: true as const };
}

/** Restart payment for an order still awaiting online payment. */
export async function retryRazorpayPayment(orderId: string): Promise<PlaceOrderResult> {
  const user = await assertUser();
  const order = await db.order.findFirst({ where: { id: orderId, userId: user.id } });
  if (!order || order.paymentMethod !== "RAZORPAY" || order.paymentStatus === "PAID" || order.status === "CANCELLED") {
    return { ok: false, error: "This order doesn't need a payment." };
  }
  if (!razorpayEnabled) return { ok: false, error: "Online payment isn't available right now." };
  // Never charge twice: an earlier attempt may have gone through without reaching us.
  if (await syncRazorpayPayment(order)) return { ok: false, error: "This order is already paid. Refreshing…" };
  const rp = await createRazorpayOrder(order.total, orderLabel(order.number));
  await db.order.update({ where: { id: order.id }, data: { razorpayOrderId: rp.id, paymentStatus: "PENDING" } });
  return { ok: true, orderId: order.id, razorpay: { keyId: razorpayKeyId, orderId: rp.id, amount: order.total, label: orderLabel(order.number), contact: razorpayContact(order.shipPhone) } };
}
