"use client";

import { useLayoutEffect, useRef, useState, type CSSProperties, type ElementType, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface LayerRevealProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  as?: ElementType;
  /**
   * Manual trigger (the hero headline). When omitted, the element reveals the
   * first time it scrolls into view. Elements already on screen at load just show.
   */
  play?: boolean;
  /** Delay in ms once triggered. */
  delay?: number;
}

/**
 * The layer motif: reveals its content bottom-up in 8 horizontal slices,
 * one every 40ms, like a print growing on the bed. Plays once.
 */
type AnyTag = React.ComponentType<{
  ref?: React.Ref<HTMLElement>;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}>;

export function LayerReveal({ children, className, style, as = "div", play, delay = 0 }: LayerRevealProps) {
  const Tag = as as unknown as AnyTag;
  const ref = useRef<HTMLElement>(null);
  const manual = play !== undefined;
  // "idle" = shown without animation, "waiting" = hidden until in view, "run" = animating.
  const [state, setState] = useState<"idle" | "waiting" | "run">(manual ? "waiting" : "idle");

  useLayoutEffect(() => {
    if (manual) return;
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) return; // already visible
    setState("waiting");
    // Chrome counts a target's own clip-path, so a fully clipped element never
    // "intersects". Watch the unclipped parent and check our own rect instead.
    const io = new IntersectionObserver(
      () => {
        if (el.getBoundingClientRect().top < window.innerHeight * 0.88) {
          setState("run");
          io.disconnect();
        }
      },
      { threshold: Array.from({ length: 21 }, (_, i) => i / 20) },
    );
    io.observe(el.parentElement ?? el);
    return () => io.disconnect();
  }, [manual]);

  const current = manual ? (play ? "run" : "waiting") : state;

  return (
    <Tag
      ref={ref}
      className={cn(className, current !== "idle" && "layer-hidden", current === "run" && "animate-layer-print")}
      style={current === "run" && delay ? { ...style, animationDelay: `${delay}ms` } : style}
    >
      {children}
    </Tag>
  );
}
