"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { OrderStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { assertAdmin } from "@/lib/shop/session";
import { rupeesToPaise } from "@/lib/shop/money";
import { ORDER_STATUS_LABEL } from "@/lib/shop/status";

type Result = { ok: true; id?: string } | { ok: false; error: string };

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);

const first = (e: z.ZodError) => e.issues[0]?.message ?? "Check the form";

function revalidateShop() {
  revalidatePath("/shop", "layout");
  revalidatePath("/product", "layout");
  revalidatePath("/admin", "layout");
}

/* ------------------------------- Categories ------------------------------- */

const categorySchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "Name the category").max(60),
  slug: z.string().trim().max(80).optional(),
  description: z.string().trim().max(300).optional(),
  image: z.string().trim().max(500).optional(),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
  isActive: z.boolean().default(true),
});

export async function saveCategory(input: z.input<typeof categorySchema>): Promise<Result> {
  await assertAdmin();
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: first(parsed.error) };
  const { id, name, description, image, sortOrder, isActive } = parsed.data;
  const slug = slugify(parsed.data.slug || name);
  if (!slug) return { ok: false, error: "Add a name with letters or numbers" };
  const clash = await db.category.findFirst({ where: { slug, NOT: id ? { id } : undefined } });
  if (clash) return { ok: false, error: `Another category already uses the link "${slug}"` };
  const data = { name, slug, description: description || null, image: image || null, sortOrder, isActive };
  const saved = id ? await db.category.update({ where: { id }, data }) : await db.category.create({ data });
  revalidateShop();
  return { ok: true, id: saved.id };
}

export async function deleteCategory(id: string): Promise<Result> {
  await assertAdmin();
  const count = await db.product.count({ where: { categoryId: id } });
  if (count) return { ok: false, error: `Move or delete its ${count} products first, or hide the category instead.` };
  await db.category.delete({ where: { id } });
  revalidateShop();
  return { ok: true };
}

/* -------------------------------- Products -------------------------------- */

const productSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "Name the product").max(120),
  slug: z.string().trim().max(80).optional(),
  description: z.string().trim().min(10, "Add a short description (10+ characters)").max(5000),
  price: z.coerce.number().positive("Set a price").max(10_00_000),
  // "" must be tried first: z.coerce.number("") is 0, which would pass.
  compareAt: z.union([z.literal(""), z.null(), z.coerce.number().positive()]).optional(),
  categoryId: z.string().min(1, "Pick a category"),
  images: z.array(z.string().trim().min(1)).max(10),
  colors: z.array(z.string().trim().min(1).max(40)).max(20),
  material: z.string().trim().max(60).optional(),
  leadTimeDays: z.coerce.number().int().min(0).max(60).default(3),
  stock: z.union([z.literal(""), z.null(), z.coerce.number().int().min(0)]).optional(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
});

export async function saveProduct(input: z.input<typeof productSchema>): Promise<Result> {
  await assertAdmin();
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: first(parsed.error) };
  const p = parsed.data;
  const slug = slugify(p.slug || p.name);
  if (!slug) return { ok: false, error: "Add a name with letters or numbers" };
  const clash = await db.product.findFirst({ where: { slug, NOT: p.id ? { id: p.id } : undefined } });
  if (clash) return { ok: false, error: `Another product already uses the link "${slug}"` };
  const price = rupeesToPaise(p.price);
  const compareAt = p.compareAt === "" || p.compareAt == null ? null : rupeesToPaise(p.compareAt);
  if (compareAt !== null && compareAt <= price) return { ok: false, error: "The 'was' price should be higher than the price" };
  const data = {
    name: p.name,
    slug,
    description: p.description,
    price,
    compareAt,
    categoryId: p.categoryId,
    images: p.images,
    colors: p.colors,
    material: p.material || null,
    leadTimeDays: p.leadTimeDays,
    stock: p.stock === "" || p.stock == null ? null : p.stock,
    isActive: p.isActive,
    isFeatured: p.isFeatured,
  };
  const saved = p.id ? await db.product.update({ where: { id: p.id }, data }) : await db.product.create({ data });
  revalidateShop();
  return { ok: true, id: saved.id };
}

export async function setProductActive(id: string, isActive: boolean): Promise<Result> {
  await assertAdmin();
  await db.product.update({ where: { id }, data: { isActive } });
  revalidateShop();
  return { ok: true };
}

/** Products that were ever ordered are hidden instead, so old orders keep their links. */
export async function deleteProduct(id: string): Promise<Result> {
  await assertAdmin();
  const ordered = await db.orderItem.count({ where: { productId: id } });
  if (ordered) {
    await db.product.update({ where: { id }, data: { isActive: false } });
    revalidateShop();
    return { ok: false, error: "This product has orders, so it was hidden from the shop instead of deleted." };
  }
  await db.product.delete({ where: { id } });
  revalidateShop();
  return { ok: true };
}

/* --------------------------------- Orders --------------------------------- */

const STATUSES = ["PENDING_PAYMENT", "PLACED", "CONFIRMED", "PRINTING", "SHIPPED", "DELIVERED", "CANCELLED"] as const;

export async function updateOrderStatus(orderId: string, status: OrderStatus, note?: string): Promise<Result> {
  await assertAdmin();
  if (!STATUSES.includes(status)) return { ok: false, error: "Unknown status" };
  const order = await db.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order) return { ok: false, error: "Order not found" };
  if (order.status === status && !note) return { ok: true };
  if (order.status === "CANCELLED" && status !== "CANCELLED") return { ok: false, error: "Cancelled orders can't be reopened. Ask the customer to order again." };

  await db.$transaction(async (tx) => {
    if (status === "CANCELLED" && order.status !== "CANCELLED") {
      for (const i of order.items) {
        if (i.productId) await tx.product.updateMany({ where: { id: i.productId, stock: { not: null } }, data: { stock: { increment: i.quantity } } });
      }
    }
    await tx.order.update({
      where: { id: orderId },
      data: {
        status,
        // Cash on delivery counts as paid once delivered.
        ...(status === "DELIVERED" && order.paymentMethod === "COD" ? { paymentStatus: "PAID" } : {}),
        events: { create: { status, note: note?.trim() || defaultNote(status) } },
      },
    });
  });
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
  revalidatePath(`/account/orders/${orderId}`);
  return { ok: true };
}

function defaultNote(status: OrderStatus) {
  switch (status) {
    case "CONFIRMED":
      return "We've confirmed your order and queued it for printing.";
    case "PRINTING":
      return "Your order is on the printer.";
    case "SHIPPED":
      return "Your order is on its way.";
    case "DELIVERED":
      return "Delivered. Enjoy your print!";
    case "CANCELLED":
      return "Order cancelled.";
    default:
      return ORDER_STATUS_LABEL[status];
  }
}

const trackingSchema = z.object({
  courier: z.string().trim().max(60).optional(),
  trackingNumber: z.string().trim().max(80).optional(),
  trackingUrl: z.union([z.string().trim().url("Tracking link must start with https://"), z.literal("")]).optional(),
});

export async function setTracking(orderId: string, input: z.input<typeof trackingSchema>): Promise<Result> {
  await assertAdmin();
  const parsed = trackingSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: first(parsed.error) };
  const t = parsed.data;
  await db.order.update({
    where: { id: orderId },
    data: {
      courier: t.courier || null,
      trackingNumber: t.trackingNumber || null,
      trackingUrl: t.trackingUrl || null,
      events: { create: { note: `Tracking updated: ${[t.courier, t.trackingNumber].filter(Boolean).join(" · ") || "removed"}.` } },
    },
  });
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath(`/account/orders/${orderId}`);
  return { ok: true };
}

export async function addOrderNote(orderId: string, note: string): Promise<Result> {
  await assertAdmin();
  const text = note.trim();
  if (!text) return { ok: false, error: "Write a note" };
  await db.orderEvent.create({ data: { orderId, note: text.slice(0, 500) } });
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath(`/account/orders/${orderId}`);
  return { ok: true };
}

export async function setPaymentStatus(orderId: string, paymentStatus: "PAID" | "REFUNDED" | "PENDING"): Promise<Result> {
  await assertAdmin();
  await db.order.update({
    where: { id: orderId },
    data: { paymentStatus, events: { create: { note: paymentStatus === "PAID" ? "Payment received." : paymentStatus === "REFUNDED" ? "Payment refunded." : "Payment marked as pending." } } },
  });
  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath(`/account/orders/${orderId}`);
  return { ok: true };
}

/** Message a customer about their order from the admin side. */
export async function adminMessageAboutOrder(orderId: string, message: string): Promise<Result> {
  await assertAdmin();
  const text = message.trim();
  if (!text) return { ok: false, error: "Write a message" };
  const order = await db.order.findUnique({ where: { id: orderId }, select: { userId: true, number: true } });
  if (!order) return { ok: false, error: "Order not found" };
  const existing = await db.conversation.findFirst({ where: { orderId }, orderBy: { lastMessageAt: "desc" } });
  const convo = existing
    ? await db.conversation.update({
        where: { id: existing.id },
        data: { lastMessageAt: new Date(), status: "OPEN", customerUnread: true, messages: { create: { sender: "ADMIN", body: text } } },
      })
    : await db.conversation.create({
        data: {
          userId: order.userId,
          orderId,
          subject: `Order VK-${order.number}`,
          adminUnread: false,
          customerUnread: true,
          messages: { create: { sender: "ADMIN", body: text } },
        },
      });
  revalidatePath(`/admin/orders/${orderId}`);
  return { ok: true, id: convo.id };
}
