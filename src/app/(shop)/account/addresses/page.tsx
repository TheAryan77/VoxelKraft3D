import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/shop/session";
import type { AddressInput } from "@/lib/shop/address";
import { AddressBook } from "./AddressBook";

export const metadata: Metadata = { title: "Addresses" };

export default async function AddressesPage() {
  const user = await requireUser("/account/addresses");
  const addresses = await db.address.findMany({ where: { userId: user.id }, orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] });
  return (
    <AddressBook
      addresses={addresses.map(({ id, fullName, phone, line1, line2, city, state, pincode, isDefault }) => ({ id, fullName, phone, line1, line2: line2 ?? "", city, state: state as AddressInput["state"], pincode, isDefault }))}
    />
  );
}
