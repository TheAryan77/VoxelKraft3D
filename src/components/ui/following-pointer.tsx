"use client";
// Aceternity UI — Following Pointer, turned into a site-wide cursor: an arrow
// plus a pill whose wording and shade come from the nearest
// [data-cursor] / [data-cursor-tone] ancestor of whatever is under the mouse.
// Mouse-only (fine pointer + hover); text fields keep the native caret.
import { useEffect, useState } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useReducedMotion, type MotionValue } from "motion/react";
import type { PointerTone } from "@/lib/cursor";

const TONES: Record<PointerTone, { bg: string; fg: string }> = {
  molten: { bg: "#ff6a13", fg: "#050505" },
  ember: { bg: "#ff8a3d", fg: "#050505" },
  amber: { bg: "#f2b04b", fg: "#050505" },
  pei: { bg: "#b8925a", fg: "#050505" },
  rim: { bg: "#9fb4c7", fg: "#050505" },
  ink: { bg: "var(--color-text)", fg: "var(--color-bg)" },
};

const NATIVE_CURSOR = 'input, textarea, select, [contenteditable="true"], [data-cursor="native"]';

export function FollowingPointerLayer() {
  const [enabled, setEnabled] = useState(false);
  const [visible, setVisible] = useState(false);
  const [label, setLabel] = useState<string | null>(null);
  const [tone, setTone] = useState<PointerTone>("molten");
  const [pressed, setPressed] = useState(false);
  const reduced = useReducedMotion();

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  // The pill trails the arrow slightly, like the original component.
  const pillX = useSpring(x, { stiffness: 600, damping: 40, mass: 0.4 });
  const pillY = useSpring(y, { stiffness: 600, damping: 40, mass: 0.4 });

  useEffect(() => {
    const mql = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setEnabled(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (!enabled) {
      root.classList.remove("has-follow-pointer");
      return;
    }
    root.classList.add("has-follow-pointer");

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") {
        setVisible(false);
        return;
      }
      x.set(e.clientX);
      y.set(e.clientY);
      const target = e.target instanceof Element ? e.target : null;
      if (target?.closest(NATIVE_CURSOR)) {
        setVisible(false);
        return;
      }
      setVisible(true);
      const host = target?.closest<HTMLElement>("[data-cursor]");
      setLabel(host?.dataset.cursor || null);
      const nextTone = (target?.closest<HTMLElement>("[data-cursor-tone]")?.dataset.cursorTone ?? "molten") as PointerTone;
      setTone(nextTone in TONES ? nextTone : "molten");
    };
    const onLeave = (e: PointerEvent) => {
      if (!e.relatedTarget) setVisible(false);
    };
    const onDown = () => setPressed(true);
    const onUp = () => setPressed(false);

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerout", onLeave);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("blur", () => setVisible(false));
    return () => {
      root.classList.remove("has-follow-pointer");
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerout", onLeave);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
    };
  }, [enabled, x, y]);

  if (!enabled) return null;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[250]">
      <AnimatePresence>
        {visible && (
          <FollowPointer
            key="pointer"
            x={x}
            y={y}
            pillX={reduced ? x : pillX}
            pillY={reduced ? y : pillY}
            title={label}
            tone={tone}
            pressed={pressed}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export const FollowPointer = ({
  x,
  y,
  pillX,
  pillY,
  title,
  tone,
  pressed,
}: {
  x: MotionValue<number>;
  y: MotionValue<number>;
  pillX: MotionValue<number>;
  pillY: MotionValue<number>;
  title: string | null;
  tone: PointerTone;
  pressed: boolean;
}) => {
  const colors = TONES[tone];
  return (
    <>
      <motion.div
        className="absolute left-0 top-0"
        style={{ x, y }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: pressed ? 0.85 : 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ duration: 0.15 }}
      >
        <svg
          viewBox="0 0 16 16"
          className="h-5 w-5 -translate-x-[3px] -translate-y-[3px] -rotate-[70deg] drop-shadow-[0_1px_1px_rgba(0,0,0,0.35)]"
          style={{ color: colors.bg, transition: "color 200ms ease" }}
          fill="currentColor"
          stroke="var(--color-bg)"
          strokeWidth="1"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M14.082 2.182a.5.5 0 0 1 .103.557L8.528 15.467a.5.5 0 0 1-.917-.007L5.57 10.694.803 8.652a.5.5 0 0 1-.006-.916l12.728-5.657a.5.5 0 0 1 .556.103z" />
        </svg>
      </motion.div>
      <motion.div className="absolute left-0 top-0" style={{ x: pillX, y: pillY }}>
        <AnimatePresence mode="popLayout">
          {title && (
            <motion.div
              key={title}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="ml-4 mt-4 min-w-max origin-top-left rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap"
              style={{ backgroundColor: colors.bg, color: colors.fg, transition: "background-color 200ms ease" }}
            >
              {title}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
};
