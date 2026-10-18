"use client";

import { useState, useTransition } from "react";
import { updateProfile } from "@/lib/shop/actions/account";
import { Button, Field, inputStyles } from "@/components/shop/ui";

export function ProfileForm({ name: initialName, phone: initialPhone }: { name: string; phone: string }) {
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await updateProfile({ name, phone });
          setMsg(r.ok ? { ok: true, text: "Saved" } : { ok: false, text: r.error });
        });
      }}
    >
      <Field label="Name">
        <input value={name} onChange={(e) => setName(e.target.value)} className={inputStyles} autoComplete="name" />
      </Field>
      <Field label="Mobile number">
        <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputStyles} autoComplete="tel" inputMode="tel" />
      </Field>
      <div className="flex items-center gap-3">
        <Button variant="outline" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
        {msg && <span className={msg.ok ? "text-sm text-text-muted" : "text-sm text-error"}>{msg.text}</span>}
      </div>
    </form>
  );
}
