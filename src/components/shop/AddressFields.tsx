"use client";

import { useEffect, useRef, useState } from "react";
import { INDIAN_STATES, type AddressInput } from "@/lib/shop/address";
import { Field, inputStyles } from "./ui";

export const emptyAddress: AddressInput = { fullName: "", phone: "", line1: "", line2: "", city: "", state: "Haryana", pincode: "" };

type Lookup = { status: "idle" | "loading" | "found" | "missing" | "error"; place?: string };

/** Controlled address form fields, shared by checkout and the address book. */
export function AddressFields({
  value,
  onChange,
  errors = {},
}: {
  value: AddressInput;
  onChange: (next: AddressInput) => void;
  errors?: Partial<Record<keyof AddressInput, string>>;
}) {
  const set = (k: keyof AddressInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => onChange({ ...value, [k]: e.target.value });
  const lookup = usePincodeLookup(value, onChange);

  const pinHint =
    lookup.status === "loading"
      ? "Looking up city and state…"
      : lookup.status === "found"
        ? `Filled in: ${lookup.place}`
        : lookup.status === "missing"
          ? "We couldn't find this PIN code. Check it, or fill in the city and state."
          : lookup.status === "error"
            ? "Couldn't look this up. Fill in the city and state."
            : "City and state fill in automatically.";

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field label="Full name" error={errors.fullName}>
        <input value={value.fullName} onChange={set("fullName")} autoComplete="name" className={inputStyles} />
      </Field>
      <Field label="Mobile number" error={errors.phone}>
        <input value={value.phone} onChange={set("phone")} autoComplete="tel" inputMode="tel" className={inputStyles} />
      </Field>
      <Field label="House, building, street" error={errors.line1} className="sm:col-span-2">
        <input value={value.line1} onChange={set("line1")} autoComplete="address-line1" className={inputStyles} />
      </Field>
      <Field label="Area, landmark (optional)" error={errors.line2} className="sm:col-span-2">
        <input value={value.line2 ?? ""} onChange={set("line2")} autoComplete="address-line2" className={inputStyles} />
      </Field>
      <Field label="PIN code" error={errors.pincode} hint={pinHint} className="sm:col-span-2">
        <input
          value={value.pincode}
          onChange={(e) => onChange({ ...value, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) })}
          autoComplete="postal-code"
          inputMode="numeric"
          maxLength={6}
          className={`${inputStyles} sm:max-w-[calc(50%-0.5rem)]`}
        />
      </Field>
      <Field label="City" error={errors.city}>
        <input value={value.city} onChange={set("city")} autoComplete="address-level2" className={inputStyles} />
      </Field>
      <Field label="State" error={errors.state}>
        <select value={value.state} onChange={set("state")} autoComplete="address-level1" className={inputStyles}>
          {INDIAN_STATES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </Field>
    </div>
  );
}

/** When a full PIN code is typed, fills in city and state (still editable). */
function usePincodeLookup(value: AddressInput, onChange: (next: AddressInput) => void) {
  const [lookup, setLookup] = useState<Lookup>({ status: "idle" });
  // Latest value/onChange without re-running the lookup on every keystroke elsewhere.
  const latest = useRef({ value, onChange });
  latest.current = { value, onChange };
  // A saved address being edited already has its city: don't look it up on open.
  const skip = useRef(value.pincode.length === 6 && value.city !== "" ? value.pincode : null);
  const pin = value.pincode;

  useEffect(() => {
    if (!/^[1-9]\d{5}$/.test(pin)) {
      setLookup({ status: "idle" });
      return;
    }
    if (skip.current === pin) return;
    skip.current = null;
    const ctrl = new AbortController();
    setLookup({ status: "loading" });
    fetch(`/api/pincode/${pin}`, { signal: ctrl.signal })
      .then(async (res) => {
        if (res.status === 404) return setLookup({ status: "missing" });
        if (!res.ok) return setLookup({ status: "error" });
        const { city, state } = (await res.json()) as { city: string; state: string | null };
        const { value: v, onChange: change } = latest.current;
        if (v.pincode !== pin) return;
        const validState = INDIAN_STATES.find((s) => s === state);
        change({ ...v, city, ...(validState ? { state: validState } : {}) });
        setLookup({ status: "found", place: [city, validState].filter(Boolean).join(", ") });
      })
      .catch((err: Error) => err.name !== "AbortError" && setLookup({ status: "error" }));
    return () => ctrl.abort();
  }, [pin]);

  return lookup;
}
