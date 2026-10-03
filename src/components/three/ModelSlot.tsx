"use client";

import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { MODELS, type ModelSlotId } from "@/lib/models.config";
import { useIsMobile, useReducedMotion } from "@/lib/useReducedMotion";
import { placeholderCopy } from "@/content/site";
import { SceneSlot } from "./SceneSlot";
import type { Framing } from "./types";

export interface ModelSlotProps {
  id: ModelSlotId;
  className?: string;
  /** CSS aspect-ratio, e.g. "4 / 3". Omit to fill the parent. */
  aspect?: string;
  mode?: "default" | "print-reveal";
  /** Orbit-able with limited zoom. */
  interactive?: boolean;
  /** Hover-driven rotation. Spins while true on desktop, while in view on mobile. */
  active?: boolean;
  /** Tilts up to ±6° toward the cursor. */
  parallax?: boolean;
  /** Hotend rides the print edge (print-reveal only). */
  hotend?: boolean;
  layer?: "page" | "modal";
  /** Camera framing: tighter margin, or lift the model higher in the slot. */
  framing?: Framing;
  /**
   * Classes that let the 3D area extend past the slot's layout box (negative
   * insets), so a model can render larger than its column without hard edges.
   */
  bleed?: string;
  /** 0..1 — dims the model by laying page background over it. */
  dim?: number;
}

/**
 * A model slot. Set `src` for this id in models.config.ts and the real model
 * replaces the placeholder with no other changes.
 */
export function ModelSlot({
  id,
  className,
  aspect,
  mode = "default",
  interactive,
  active,
  parallax,
  hotend,
  layer = "page",
  framing,
  bleed,
  dim,
}: ModelSlotProps) {
  const entry = MODELS[id];
  const isMobile = useIsMobile();
  const reduced = useReducedMotion();
  const [failed, setFailed] = useState(false);
  const onFail = useCallback(() => setFailed(true), []);

  const usePoster = !!entry.poster && (isMobile || reduced);
  const showDevTag = process.env.NODE_ENV === "development" && (!entry.src || failed);

  return (
    <div
      className={cn("relative", className)}
      style={aspect ? { aspectRatio: aspect } : undefined}
      data-model-slot={id}
    >
      {usePoster ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={entry.poster} alt="" className="absolute inset-0 h-full w-full object-contain" />
      ) : (
        <SceneSlot
          className={cn("absolute inset-0", bleed)}
          layer={layer}
          scene={{ kind: "model", id, mode, interactive, active, parallax, hotend, framing, onFail }}
        />
      )}
      {dim ? <div aria-hidden className="pointer-events-none absolute inset-0 z-[35] bg-bg" style={{ opacity: dim }} /> : null}
      {showDevTag && (
        <span className="pointer-events-none absolute left-2 top-2 z-40 rounded-md border border-line bg-surface/90 px-2 py-1 font-mono text-[10px] leading-tight text-text-muted">
          {placeholderCopy.modelSlot(id)}
        </span>
      )}
    </div>
  );
}
