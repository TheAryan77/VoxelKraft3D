/** Shades available to the following-pointer cursor. */
export type PointerTone = "molten" | "ember" | "amber" | "pei" | "rim" | "ink";

/**
 * Spread onto any element to give the cursor a label and shade while it's over
 * that element. Plain data, so server components can use it too.
 */
export function cursorProps(cursor: { label: string; tone: PointerTone }) {
  return { "data-cursor": cursor.label, "data-cursor-tone": cursor.tone } as const;
}
