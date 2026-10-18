import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/shop/session";
import { razorpayEnabled } from "@/lib/shop/razorpay";
import { shopConfig } from "@/lib/shop/config";
import { CheckoutForm } from "./CheckoutForm";

export const metadata: Metadata = { title: "Checkout" };
export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const user = await requireUser("/checkout");
  const addresses = await db.address.findMany({ where: { userId: user.id }, orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] });
  return (
    <div className="container-site">
      <h1 className="mb-8 font-heading text-[length:var(--text-heading)] text-text md:mb-12">Checkout</h1>
      <CheckoutForm
        addresses={addresses.map(({ id, fullName, phone, line1, line2, city, state, pincode }) => ({ id, fullName, phone, line1, line2, city, state, pincode }))}
        razorpayEnabled={razorpayEnabled}
        codMaxTotal={shopConfig.codMaxTotal}
        customer={{ name: user.name ?? "", email: user.email ?? "" }}
      />
    </div>
  );
}
