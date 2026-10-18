"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { IconArrowLeft, IconArrowRight, IconUpload, IconX } from "@tabler/icons-react";
import { deleteProduct, saveProduct } from "@/lib/shop/actions/admin";
import { Button, Card, Field, inputStyles } from "@/components/shop/ui";
import { cn } from "@/lib/utils";

export interface ProductFormValues {
  id?: string;
  name: string;
  slug: string;
  description: string;
  price: string;
  compareAt: string;
  categoryId: string;
  images: string[];
  colors: string;
  material: string;
  leadTimeDays: string;
  stock: string;
  isActive: boolean;
  isFeatured: boolean;
}

export function ProductForm({ initial, categories }: { initial: ProductFormValues; categories: { id: string; name: string }[] }) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pending, start] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const set = <K extends keyof ProductFormValues>(k: K, value: ProductFormValues[K]) => setV((s) => ({ ...s, [k]: value }));

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    setError(null);
    for (const file of Array.from(files)) {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body });
      const json = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !json.url) {
        setError(json.error ?? "Upload failed");
        break;
      }
      setV((s) => ({ ...s, images: [...s.images, json.url!] }));
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const move = (i: number, dir: -1 | 1) =>
    setV((s) => {
      const images = [...s.images];
      const j = i + dir;
      if (j < 0 || j >= images.length) return s;
      [images[i], images[j]] = [images[j], images[i]];
      return { ...s, images };
    });

  const submit = () =>
    start(async () => {
      setError(null);
      const r = await saveProduct({
        id: v.id,
        name: v.name,
        slug: v.slug || undefined,
        description: v.description,
        price: v.price,
        compareAt: v.compareAt,
        categoryId: v.categoryId,
        images: v.images,
        colors: v.colors.split(",").map((c) => c.trim()).filter(Boolean),
        material: v.material,
        leadTimeDays: v.leadTimeDays,
        stock: v.stock,
        isActive: v.isActive,
        isFeatured: v.isFeatured,
      });
      if (!r.ok) return setError(r.error);
      router.push("/admin/products");
      router.refresh();
    });

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
      <div className="flex flex-col gap-6 xl:col-span-8">
        <Card className="flex flex-col gap-4">
          <Field label="Name">
            <input value={v.name} onChange={(e) => set("name", e.target.value)} maxLength={120} className={inputStyles} />
          </Field>
          <Field label="Description" hint="Shown on the product page. New lines are kept.">
            <textarea value={v.description} onChange={(e) => set("description", e.target.value)} rows={6} maxLength={5000} className={cn(inputStyles, "h-auto py-3")} />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Price (₹)">
              <input value={v.price} onChange={(e) => set("price", e.target.value)} inputMode="decimal" className={inputStyles} />
            </Field>
            <Field label="Was price (₹, optional)" hint="Shows a sale badge and the old price struck through.">
              <input value={v.compareAt} onChange={(e) => set("compareAt", e.target.value)} inputMode="decimal" className={inputStyles} />
            </Field>
          </div>
        </Card>

        <Card className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg text-text">Photos</h2>
            <span className="text-xs text-text-muted">The first photo is the main one.</span>
          </div>
          <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {v.images.map((src, i) => (
              <li key={src} className="group relative aspect-square overflow-hidden rounded-[12px] border border-line bg-surface-2">
                <Image src={src} alt="" fill sizes="160px" className="object-cover" />
                <div className="absolute inset-x-1 bottom-1 flex justify-between opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
                  <button type="button" aria-label="Move left" onClick={() => move(i, -1)} className="grid h-7 w-7 place-items-center rounded-full bg-bg/80 text-text"><IconArrowLeft size={14} /></button>
                  <button type="button" aria-label="Remove photo" onClick={() => set("images", v.images.filter((x) => x !== src))} className="grid h-7 w-7 place-items-center rounded-full bg-bg/80 text-error"><IconX size={14} /></button>
                  <button type="button" aria-label="Move right" onClick={() => move(i, 1)} className="grid h-7 w-7 place-items-center rounded-full bg-bg/80 text-text"><IconArrowRight size={14} /></button>
                </div>
              </li>
            ))}
            <li>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-[12px] border border-dashed border-line text-xs text-text-muted transition-colors hover:border-pei/60 hover:text-text"
              >
                <IconUpload size={18} />
                {uploading ? "Uploading…" : "Add photos"}
              </button>
            </li>
          </ul>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple className="hidden" onChange={(e) => upload(e.target.files)} />
          <p className="text-xs text-text-muted">JPG, PNG or WebP, up to 5 MB each. Square photos look best.</p>
        </Card>
      </div>

      <div className="flex flex-col gap-6 xl:col-span-4">
        <Card className="flex flex-col gap-4">
          <Field label="Category">
            <select value={v.categoryId} onChange={(e) => set("categoryId", e.target.value)} className={inputStyles}>
              <option value="" disabled>
                Choose one
              </option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Colours" hint="Separate with commas, e.g. Black, White, Orange.">
            <input value={v.colors} onChange={(e) => set("colors", e.target.value)} className={inputStyles} />
          </Field>
          <Field label="Material">
            <input value={v.material} onChange={(e) => set("material", e.target.value)} placeholder="PLA, PETG…" className={inputStyles} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Ships in (days)">
              <input value={v.leadTimeDays} onChange={(e) => set("leadTimeDays", e.target.value)} inputMode="numeric" className={inputStyles} />
            </Field>
            <Field label="Stock" hint="Empty = made to order.">
              <input value={v.stock} onChange={(e) => set("stock", e.target.value)} inputMode="numeric" className={inputStyles} />
            </Field>
          </div>
          <Field label="Link (optional)" hint="Made from the name if left empty.">
            <input value={v.slug} onChange={(e) => set("slug", e.target.value)} placeholder="cactus-toothpick-dispenser" className={inputStyles} />
          </Field>
          <label className="flex items-center gap-2 text-sm text-text">
            <input type="checkbox" checked={v.isActive} onChange={(e) => set("isActive", e.target.checked)} className="accent-[var(--color-molten)]" />
            Show in the shop
          </label>
          <label className="flex items-center gap-2 text-sm text-text">
            <input type="checkbox" checked={v.isFeatured} onChange={(e) => set("isFeatured", e.target.checked)} className="accent-[var(--color-molten)]" />
            Featured (listed first)
          </label>
        </Card>
        {error && (
          <p role="alert" className="text-sm text-error">
            {error}
          </p>
        )}
        <div className="flex flex-wrap gap-3">
          <Button onClick={submit} disabled={pending || uploading}>
            {pending ? "Saving…" : v.id ? "Save changes" : "Add product"}
          </Button>
          {v.id && (
            <Button
              variant="danger"
              disabled={pending}
              onClick={() => {
                if (!window.confirm("Delete this product?")) return;
                start(async () => {
                  const r = await deleteProduct(v.id!);
                  if (!r.ok) setError(r.error);
                  router.push("/admin/products");
                  router.refresh();
                });
              }}
            >
              Delete
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
