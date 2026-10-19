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

/** Below this many left, product pages say "Only N left". */
export const LOW_STOCK_AT = 5;

/**
 * Store policies, shown on product pages, at checkout and on orders.
 * Edit the wording here and it changes everywhere.
 */
export const shopPolicy = {
  customisation: {
    title: "Customisation",
    short: "Want a change (colour, size, name)? You can edit your customisation request until printing starts.",
    body: "You can add or change your customisation request (colour, size, text, small tweaks) any time until your order goes into printing. Once printing starts, it can't be changed or cancelled.",
    locked: "Printing has started, so the customisation can no longer be changed.",
  },
  returns: {
    title: "No returns or refunds",
    short: "Made to order: no returns or refunds. Exchange only for a damaged or wrong item, with proof.",
    body: "Every piece is printed to order, so orders can't be returned or refunded. If your item arrives damaged or isn't what you ordered, we'll exchange it. Raise a query with genuine proof: clear photos or, better, an unboxing video.",
  },
};
