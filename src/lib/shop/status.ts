import type { OrderStatus, PaymentStatus } from "@prisma/client";

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "Awaiting payment",
  PLACED: "Order placed",
  CONFIRMED: "Confirmed",
  PRINTING: "Printing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

/** The normal journey, in order, for the tracking timeline. */
export const ORDER_FLOW: OrderStatus[] = ["PLACED", "CONFIRMED", "PRINTING", "SHIPPED", "DELIVERED"];

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  PENDING: "Payment pending",
  PAID: "Paid",
  FAILED: "Payment failed",
  REFUNDED: "Refunded",
};

export const ORDER_STATUS_TONE: Record<OrderStatus, "muted" | "live" | "done" | "bad"> = {
  PENDING_PAYMENT: "muted",
  PLACED: "live",
  CONFIRMED: "live",
  PRINTING: "live",
  SHIPPED: "live",
  DELIVERED: "done",
  CANCELLED: "bad",
};

/** Until printing starts the customer can still cancel or change their customisation. */
export const EDITABLE_STATUSES: OrderStatus[] = ["PENDING_PAYMENT", "PLACED", "CONFIRMED"];

export function isEditable(status: OrderStatus) {
  return EDITABLE_STATUSES.includes(status);
}
