const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

/** Paise → "₹1,299". */
export function formatPrice(paise: number) {
  return inr.format(Math.round(paise) / 100);
}

/** "1299" or "1299.50" (rupees, from a form) → paise. */
export function rupeesToPaise(value: string | number) {
  return Math.round(Number(value) * 100);
}
