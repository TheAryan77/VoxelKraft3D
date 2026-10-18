"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function Gallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0);
  if (!images.length) return <div className="layer-lines aspect-square w-full rounded-[20px] border border-line !h-auto" />;
  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-square overflow-hidden rounded-[20px] border border-line bg-surface-2">
        <Image src={images[active]} alt={name} fill priority sizes="(min-width: 768px) 58vw, 100vw" className="object-cover" />
      </div>
      {images.length > 1 && (
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Show photo ${i + 1}`}
              aria-pressed={active === i}
              className={cn(
                "relative h-20 w-20 shrink-0 overflow-hidden rounded-[12px] border bg-surface-2 transition-colors",
                active === i ? "border-molten" : "border-line hover:border-pei/50",
              )}
            >
              <Image src={src} alt="" fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
