"use client";

import { useEffect, type ReactNode } from "react";
import { ReactLenis, useLenis } from "lenis/react";
import { modalOpen } from "@/lib/sceneStore";
import { useReducedMotion } from "@/lib/useReducedMotion";

/** Lenis smooth scroll (lerp 0.1). Off under prefers-reduced-motion. */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  if (reduced) return <>{children}</>;
  return (
    <ReactLenis root options={{ lerp: 0.1, anchors: { offset: -80 } }}>
      <ModalScrollLock />
      {children}
    </ReactLenis>
  );
}

/** Stops page scrolling while a modal is open. */
function ModalScrollLock() {
  const lenis = useLenis();
  useEffect(
    () =>
      modalOpen.subscribe(() => {
        if (modalOpen.get()) lenis?.stop();
        else lenis?.start();
      }),
    [lenis],
  );
  return null;
}
