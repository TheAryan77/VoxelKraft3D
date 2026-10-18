"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteCategory, saveCategory } from "@/lib/shop/actions/admin";
import { Button, Card, Field, Pill, inputStyles } from "@/components/shop/ui";

type Cat = { id?: string; name: string; slug: string; description: string; image: string; sortOrder: string; isActive: boolean; productCount?: number };
const blank: Cat = { name: "", slug: "", description: "", image: "", sortOrder: "0", isActive: true };

export function CategoryManager({ categories }: { categories: Cat[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Cat | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const save = () =>
    start(async () => {
      if (!editing) return;
      setError(null);
      const r = await saveCategory({ ...editing, slug: editing.slug || undefined });
      if (!r.ok) return setError(r.error);
      setEditing(null);
      router.refresh();
    });

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
      <div className="flex flex-col gap-3 xl:col-span-7">
        <Button variant="outline" className="self-start" onClick={() => setEditing({ ...blank, sortOrder: String(categories.length + 1) })}>
          Add category
        </Button>
        {categories.map((c) => (
          <Card key={c.id} className={c.isActive ? "flex items-center justify-between gap-3" : "flex items-center justify-between gap-3 opacity-60"}>
            <div>
              <p className="flex items-center gap-2 text-sm text-text">
                {c.name} {!c.isActive && <Pill>Hidden</Pill>}
              </p>
              <p className="text-xs text-text-muted">
                /shop/{c.slug} · {c.productCount} products · order {c.sortOrder}
              </p>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" onClick={() => setEditing(c)}>Edit</Button>
              <Button
                variant="ghost"
                disabled={pending}
                onClick={() =>
                  window.confirm(`Delete "${c.name}"?`) &&
                  start(async () => {
                    const r = await deleteCategory(c.id!);
                    setError(r.ok ? null : r.error);
                    router.refresh();
                  })
                }
              >
                Delete
              </Button>
            </div>
          </Card>
        ))}
        {error && !editing && <p className="text-sm text-error">{error}</p>}
      </div>
      {editing && (
        <Card className="flex flex-col gap-4 self-start xl:col-span-5">
          <h2 className="font-heading text-lg text-text">{editing.id ? "Edit category" : "New category"}</h2>
          <Field label="Name">
            <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className={inputStyles} />
          </Field>
          <Field label="Description (optional)">
            <input value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} className={inputStyles} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Link (optional)">
              <input value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} className={inputStyles} />
            </Field>
            <Field label="Order" hint="Lower comes first.">
              <input value={editing.sortOrder} onChange={(e) => setEditing({ ...editing, sortOrder: e.target.value })} inputMode="numeric" className={inputStyles} />
            </Field>
          </div>
          <Field label="Cover image link (optional)" hint="Leave empty to use the first product's photo.">
            <input value={editing.image} onChange={(e) => setEditing({ ...editing, image: e.target.value })} className={inputStyles} />
          </Field>
          <label className="flex items-center gap-2 text-sm text-text">
            <input type="checkbox" checked={editing.isActive} onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })} className="accent-[var(--color-molten)]" />
            Show in the shop
          </label>
          {error && <p className="text-sm text-error">{error}</p>}
          <div className="flex gap-3">
            <Button onClick={save} disabled={pending}>{pending ? "Saving…" : "Save"}</Button>
            <Button variant="ghost" onClick={() => { setEditing(null); setError(null); }}>Cancel</Button>
          </div>
        </Card>
      )}
    </div>
  );
}
