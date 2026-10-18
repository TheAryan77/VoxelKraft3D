"use client";

import { currentAccentHex } from "@/lib/theme";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cart, cartSubtotal, useCart } from "@/lib/shop/cart";
import { formatPrice } from "@/lib/shop/money";
import { shippingFor } from "@/lib/shop/config";
import { addressSchema, type AddressInput } from "@/lib/shop/address";
import { confirmRazorpayPayment, placeOrder } from "@/lib/shop/actions/checkout";
import { AddressFields, emptyAddress } from "@/components/shop/AddressFields";
import { Button, ButtonLink, Card, EmptyState, Field, inputStyles } from "@/components/shop/ui";
import { cn } from "@/lib/utils";

type SavedAddress = { id: string; fullName: string; phone: string; line1: string; line2: string | null; city: string; state: string; pincode: string };

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void; on: (event: string, cb: (r: unknown) => void) => void };
  }
}

function loadRazorpay() {
  return new Promise<boolean>((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export function CheckoutForm({
  addresses,
  razorpayEnabled,
  codMaxTotal,
  customer,
}: {
  addresses: SavedAddress[];
  razorpayEnabled: boolean;
  codMaxTotal: number;
  customer: { name: string; email: string };
}) {
  const router = useRouter();
  const items = useCart();
  const [addressId, setAddressId] = useState<string | "new">(addresses[0]?.id ?? "new");
  const [newAddress, setNewAddress] = useState<AddressInput>({ ...emptyAddress, fullName: customer.name });
  const [errors, setErrors] = useState<Partial<Record<keyof AddressInput, string>>>({});
  const [saveAddress, setSaveAddress] = useState(true);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const subtotal = cartSubtotal(items);
  const shipping = shippingFor(subtotal);
  const total = subtotal + shipping;
  const codAllowed = total <= codMaxTotal;
  const [method, setMethod] = useState<"RAZORPAY" | "COD">(razorpayEnabled ? "RAZORPAY" : "COD");
  const effectiveMethod = !codAllowed && razorpayEnabled ? "RAZORPAY" : method;

  if (!items.length) {
    return <EmptyState title="Your cart is empty" action={<ButtonLink href="/shop">Go to the shop</ButtonLink>} />;
  }

  const submit = () => {
    setError(null);
    let parsedAddress: AddressInput | undefined;
    if (addressId === "new") {
      const r = addressSchema.safeParse(newAddress);
      if (!r.success) {
        setErrors(Object.fromEntries(r.error.issues.map((i) => [i.path[0], i.message])));
        return;
      }
      setErrors({});
      parsedAddress = r.data;
    }
    startTransition(async () => {
      const result = await placeOrder({
        items: items.map((i) => ({ productId: i.productId, color: i.color, quantity: i.quantity })),
        addressId: addressId === "new" ? undefined : addressId,
        newAddress: parsedAddress,
        saveAddress,
        paymentMethod: effectiveMethod,
        note: note || undefined,
      });
      if (!result.ok) return setError(result.error);

      if (!result.razorpay) {
        cart.clear();
        router.push(`/account/orders/${result.orderId}?placed=1`);
        return;
      }
      const loaded = await loadRazorpay();
      if (!loaded || !window.Razorpay) {
        setError("Couldn't load the payment window. Check your connection and try again from your orders page.");
        router.push(`/account/orders/${result.orderId}`);
        return;
      }
      const rp = new window.Razorpay({
        key: result.razorpay.keyId,
        order_id: result.razorpay.orderId,
        amount: result.razorpay.amount,
        currency: "INR",
        name: "Voxel Kraft 3D",
        description: `Order ${result.razorpay.label}`,
        prefill: { name: customer.name, email: customer.email },
        theme: { color: currentAccentHex() },
        handler: (resp: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          startTransition(async () => {
            const confirmed = await confirmRazorpayPayment({
              orderId: result.orderId,
              razorpayOrderId: resp.razorpay_order_id,
              razorpayPaymentId: resp.razorpay_payment_id,
              razorpaySignature: resp.razorpay_signature,
            });
            cart.clear();
            router.push(`/account/orders/${result.orderId}${confirmed.ok ? "?placed=1" : ""}`);
          });
        },
        modal: {
          ondismiss: () => setError("Payment was cancelled. Your order is saved; you can pay from your orders page or place it again."),
        },
      });
      rp.open();
    });
  };

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
      <div className="flex flex-col gap-6 lg:col-span-8">
        <Card>
          <h2 className="mb-4 font-heading text-lg text-text">Delivery address</h2>
          <div className="flex flex-col gap-3">
            {addresses.map((a) => (
              <label key={a.id} className={cn("flex cursor-pointer gap-3 rounded-[14px] border p-4 transition-colors", addressId === a.id ? "border-molten" : "border-line hover:border-pei/50")}>
                <input type="radio" name="address" checked={addressId === a.id} onChange={() => setAddressId(a.id)} className="mt-1 accent-[var(--color-molten)]" />
                <span className="text-sm">
                  <span className="block text-text">
                    {a.fullName} <span className="text-text-muted">· {a.phone}</span>
                  </span>
                  <span className="block text-text-muted">
                    {[a.line1, a.line2, a.city, `${a.state} ${a.pincode}`].filter(Boolean).join(", ")}
                  </span>
                </span>
              </label>
            ))}
            <label className={cn("flex cursor-pointer gap-3 rounded-[14px] border p-4 transition-colors", addressId === "new" ? "border-molten" : "border-line hover:border-pei/50")}>
              <input type="radio" name="address" checked={addressId === "new"} onChange={() => setAddressId("new")} className="mt-1 accent-[var(--color-molten)]" />
              <span className="text-sm text-text">{addresses.length ? "Use a new address" : "New address"}</span>
            </label>
          </div>
          {addressId === "new" && (
            <div className="mt-5 flex flex-col gap-4">
              <AddressFields value={newAddress} onChange={setNewAddress} errors={errors} />
              <label className="flex items-center gap-2 text-sm text-text-muted">
                <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} className="accent-[var(--color-molten)]" />
                Save this address for next time
              </label>
            </div>
          )}
        </Card>

        <Card>
          <h2 className="mb-4 font-heading text-lg text-text">Payment</h2>
          <div className="flex flex-col gap-3">
            {razorpayEnabled && (
              <PayOption checked={effectiveMethod === "RAZORPAY"} onChange={() => setMethod("RAZORPAY")} title="Pay online" body="UPI, cards, netbanking and wallets via Razorpay." />
            )}
            <PayOption
              checked={effectiveMethod === "COD"}
              onChange={() => setMethod("COD")}
              disabled={!codAllowed}
              title="Cash on delivery"
              body={codAllowed ? "Pay when your order arrives." : `Available for orders up to ${formatPrice(codMaxTotal)}.`}
            />
          </div>
        </Card>

        <Card>
          <Field label="Note for us (optional)" hint="Colour preferences, gift message, delivery instructions…">
            <textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} rows={3} className={cn(inputStyles, "h-auto py-3")} />
          </Field>
        </Card>
      </div>

      <aside className="lg:col-span-4">
        <Card className="flex flex-col gap-3 lg:sticky lg:top-28">
          <h2 className="font-heading text-lg text-text">Order summary</h2>
          <ul className="flex flex-col gap-2 border-b border-line pb-3">
            {items.map((i) => (
              <li key={`${i.productId}-${i.color ?? ""}`} className="flex justify-between gap-3 text-sm">
                <span className="text-text-muted">
                  {i.name}
                  {i.color ? ` (${i.color})` : ""} × {i.quantity}
                </span>
                <span className="shrink-0 font-machine text-text">{formatPrice(i.price * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <Row label="Subtotal" value={formatPrice(subtotal)} />
          <Row label="Shipping" value={shipping === 0 ? "Free" : formatPrice(shipping)} />
          <div className="border-t border-line pt-3">
            <Row label="Total" value={formatPrice(total)} strong />
          </div>
          {error && (
            <p role="alert" className="text-sm text-error">
              {error}
            </p>
          )}
          <Button onClick={submit} disabled={pending} className="mt-2 h-12 w-full">
            {pending ? "Placing order…" : effectiveMethod === "RAZORPAY" ? `Pay ${formatPrice(total)}` : "Place order"}
          </Button>
          <p className="text-xs text-text-muted">
            By placing the order you agree to our <Link href="/contact" className="underline">terms</Link>. Prints are made to order.
          </p>
        </Card>
      </aside>
    </div>
  );
}

function PayOption({ checked, onChange, title, body, disabled }: { checked: boolean; onChange: () => void; title: string; body: string; disabled?: boolean }) {
  return (
    <label className={cn("flex gap-3 rounded-[14px] border p-4 transition-colors", disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer", checked ? "border-molten" : "border-line hover:border-pei/50")}>
      <input type="radio" name="payment" checked={checked} onChange={onChange} disabled={disabled} className="mt-1 accent-[var(--color-molten)]" />
      <span className="text-sm">
        <span className="block text-text">{title}</span>
        <span className="block text-text-muted">{body}</span>
      </span>
    </label>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between text-sm">
      <span className="text-text-muted">{label}</span>
      <span className={strong ? "font-machine text-lg text-text" : "font-machine text-text"}>{value}</span>
    </div>
  );
}
