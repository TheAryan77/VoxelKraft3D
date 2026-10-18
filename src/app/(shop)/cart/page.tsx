import type { Metadata } from "next";
import { CartView } from "./CartView";

export const metadata: Metadata = { title: "Cart" };

export default function CartPage() {
  return (
    <div className="container-site">
      <h1 className="mb-8 font-heading text-[length:var(--text-heading)] text-text md:mb-12">Your cart</h1>
      <CartView />
    </div>
  );
}
