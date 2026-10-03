import Image from "next/image";
import { cn } from "@/lib/utils";
import { placeholderCopy } from "@/content/site";
import { LayerReveal } from "./LayerReveal";

interface PhotoSlotProps {
  src: string;
  alt: string;
  /** Whether the file exists in /public (checked on the server). */
  available: boolean;
  className?: string;
  sizes?: string;
  priority?: boolean;
  /** Layer-slice reveal on first view. */
  reveal?: boolean;
}

/**
 * A real photo, or an intentional placeholder block (surface colour plus the
 * expected filename) until the photo is added to /public.
 */
export function PhotoSlot({ src, alt, available, className, sizes = "(min-width: 1024px) 33vw, 100vw", priority, reveal = true }: PhotoSlotProps) {
  const content = available ? (
    <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />
  ) : (
    <div role="img" aria-label={alt} className="absolute inset-0 flex items-end bg-surface-2 p-4">
      <div aria-hidden className="absolute inset-0 opacity-60 layer-lines [mask-image:linear-gradient(to_top,black,transparent_70%)] !h-full" />
      <span className="relative font-mono text-[11px] text-text-muted">{placeholderCopy.photoMissing(`public${src}`)}</span>
    </div>
  );

  const Wrapper = reveal ? LayerReveal : "div";
  return <Wrapper className={cn("relative overflow-hidden bg-surface-2", className)}>{content}</Wrapper>;
}
