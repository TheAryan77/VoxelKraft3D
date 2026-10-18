"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { AddressInput } from "@/lib/shop/address";
import { deleteAddress, saveAddress, setDefaultAddress } from "@/lib/shop/actions/account";
import { AddressFields, emptyAddress } from "@/components/shop/AddressFields";
import { Button, Card, EmptyState, Pill } from "@/components/shop/ui";

type Saved = AddressInput & { id: string; isDefault: boolean };

export function AddressBook({ addresses }: { addresses: Saved[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<(AddressInput & { id?: string }) | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, after?: () => void) =>
    start(async () => {
      setError(null);
      const r = await fn();
      if (!r.ok) return setError(r.error ?? "Something went wrong");
      after?.();
      router.refresh();
    });

  if (editing) {
    return (
      <Card className="max-w-2xl">
        <h2 className="mb-5 font-heading text-lg text-text">{editing.id ? "Edit address" : "New address"}</h2>
        <AddressFields value={editing} onChange={(v) => setEditing({ ...v, id: editing.id })} />
        {error && <p className="mt-4 text-sm text-error">{error}</p>}
        <div className="mt-6 flex gap-3">
          <Button disabled={pending} onClick={() => run(() => saveAddress(editing), () => setEditing(null))}>
            {pending ? "Saving…" : "Save address"}
          </Button>
          <Button variant="ghost" onClick={() => setEditing(null)}>
            Cancel
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Button variant="outline" onClick={() => setEditing({ ...emptyAddress })}>
          Add an address
        </Button>
      </div>
      {error && <p className="text-sm text-error">{error}</p>}
      {addresses.length === 0 ? (
        <EmptyState title="No saved addresses" body="Addresses you save here show up at checkout." />
      ) : (
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {addresses.map((a) => (
            <li key={a.id}>
              <Card className="flex h-full flex-col gap-3">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-text">{a.fullName}</p>
                  {a.isDefault && <Pill>Default</Pill>}
                </div>
                <p className="text-sm text-text-muted">
                  {[a.line1, a.line2, a.city, `${a.state} ${a.pincode}`].filter(Boolean).join(", ")}
                  <br />
                  {a.phone}
                </p>
                <div className="mt-auto flex flex-wrap gap-1">
                  <Button variant="ghost" onClick={() => setEditing({ ...a })}>Edit</Button>
                  {!a.isDefault && <Button variant="ghost" disabled={pending} onClick={() => run(() => setDefaultAddress(a.id))}>Make default</Button>}
                  <Button variant="ghost" disabled={pending} onClick={() => window.confirm("Delete this address?") && run(() => deleteAddress(a.id))}>
                    Delete
                  </Button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
