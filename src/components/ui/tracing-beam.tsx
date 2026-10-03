"use client";
// Aceternity UI — Tracing Beam, restyled as a strand of molten filament with a
// soft glow at its leading tip. Height follows the content via ResizeObserver.
import React, { useEffect, useId, useRef, useState } from "react";
import { motion, useTransform, useScroll, useSpring, useMotionValueEvent } from "motion/react";
import { cn } from "@/lib/utils";

export const TracingBeam = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const gradientId = useId().replace(/:/g, "");
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 70%", "end 60%"],
  });

  const contentRef = useRef<HTMLDivElement>(null);
  const [svgHeight, setSvgHeight] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const update = () => setSvgHeight(el.offsetHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useMotionValueEvent(scrollYProgress, "change", (v) => setStarted(v > 0.01));

  // Leading tip of the filament. Everything above it has been "laid down".
  const tip = useSpring(useTransform(scrollYProgress, [0, 0.95], [0, svgHeight]), { stiffness: 500, damping: 90 });
  const tipY = useTransform(tip, (v) => Math.max(0, Math.min(svgHeight, v)));

  return (
    <motion.div ref={ref} className={cn("relative w-full", className)}>
      <div aria-hidden className="absolute left-0 top-0 h-full w-6 md:w-10">
        <div
          className={cn(
            "relative z-10 ml-[3px] flex h-4 w-4 items-center justify-center rounded-full border transition-colors duration-500",
            started ? "border-molten/60" : "border-line",
          )}
        >
          <div className={cn("h-1.5 w-1.5 rounded-full transition-colors duration-500", started ? "bg-molten" : "bg-line")} />
        </div>
        <svg viewBox={`0 0 20 ${svgHeight}`} width="20" height={svgHeight} className="absolute left-0 top-2 block overflow-visible">
          <path d={`M 11 0 V ${svgHeight}`} fill="none" stroke="var(--color-line)" strokeWidth="1" />
          <motion.path
            d={`M 11 0 V ${svgHeight}`}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth="2"
            strokeLinecap="round"
            className="motion-reduce:hidden"
          />
          <motion.circle cx="11" cy={tipY} r="7" fill="var(--color-molten)" opacity="0.25" className="motion-reduce:hidden" style={{ filter: "blur(4px)" }} />
          <motion.circle cx="11" cy={tipY} r="2.2" fill="#ffb27a" className="motion-reduce:hidden" />
          <defs>
            {/* Cooled filament behind, hot at the tip, nothing ahead of it. */}
            <motion.linearGradient id={gradientId} gradientUnits="userSpaceOnUse" x1="0" x2="0" y1="0" y2={tipY}>
              <stop stopColor="#ff6a13" stopOpacity="0.18" />
              <stop offset="0.82" stopColor="#ff6a13" stopOpacity="0.7" />
              <stop offset="0.985" stopColor="#ffb27a" stopOpacity="1" />
              <stop offset="1" stopColor="#ffb27a" stopOpacity="0" />
            </motion.linearGradient>
          </defs>
        </svg>
      </div>
      <div ref={contentRef} className="pl-10 md:pl-16">
        {children}
      </div>
    </motion.div>
  );
};
