"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setProductActive } from "@/lib/shop/actions/admin";

export function ProductRowActions({ id, slug, isActive }: { id: string; slug: string; isActive: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <div className="flex justify-end gap-3 text-xs">
      <Link href={`/admin/products/${id}`} className="text-text-muted hover:text-text">Edit</Link>
      {isActive && (
        <Link href={`/product/${slug}`} target="_blank" className="text-text-muted hover:text-text">
          View
        </Link>
      )}
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            await setProductActive(id, !isActive);
            router.refresh();
          })
        }
        className="text-text-muted hover:text-text"
      >
        {isActive ? "Hide" : "Show"}
      </button>
    </div>
  );
}
