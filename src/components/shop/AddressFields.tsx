"use client";

import { INDIAN_STATES, type AddressInput } from "@/lib/shop/address";
import { Field, inputStyles } from "./ui";

export const emptyAddress: AddressInput = { fullName: "", phone: "", line1: "", line2: "", city: "", state: "Haryana", pincode: "" };

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
      <Field label="City" error={errors.city}>
        <input value={value.city} onChange={set("city")} autoComplete="address-level2" className={inputStyles} />
      </Field>
      <Field label="PIN code" error={errors.pincode}>
        <input value={value.pincode} onChange={set("pincode")} autoComplete="postal-code" inputMode="numeric" maxLength={6} className={inputStyles} />
      </Field>
      <Field label="State" error={errors.state} className="sm:col-span-2">
        <select value={value.state} onChange={set("state")} className={inputStyles}>
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
