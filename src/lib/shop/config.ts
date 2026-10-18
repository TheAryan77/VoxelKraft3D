/**
 * Shop settings. Prices are in paise (₹1 = 100). Change these to suit.
 */
export const shopConfig = {
  /** Flat shipping per order. */
  shippingFee: 99_00,
  /** Orders at or above this subtotal ship free. */
  freeShippingFrom: 999_00,
  /** Cash on delivery is offered up to this order total. */
  codMaxTotal: 5000_00,
  /** Shown as VK-1001 etc. */
  orderPrefix: "VK-",
  maxQuantityPerItem: 10,
};

export function shippingFor(subtotal: number) {
  return subtotal === 0 || subtotal >= shopConfig.freeShippingFrom ? 0 : shopConfig.shippingFee;
}

export function orderLabel(number: number) {
  return `${shopConfig.orderPrefix}${number}`;
}
