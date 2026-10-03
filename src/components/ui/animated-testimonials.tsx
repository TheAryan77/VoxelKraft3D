"use client";
// Aceternity UI — Animated Testimonials, restyled: photos stack with fixed
// (not per-render random) tilts, names in the PEI accent, molten arrows.
// Photos fall back to placeholder blocks until the real files exist.

import { IconArrowLeft, IconArrowRight } from "@tabler/icons-react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export type Testimonial = {
  quote: string;
  name: string;
  designation: string;
  src: string;
  /** Whether the photo exists in /public (checked on the server). */
  available?: boolean;
  /** CSS object-position for the crop, e.g. "50% 70%". */
  position?: string;
};

const TILTS = [-7, 5, -3, 8, -5, 3];

export const AnimatedTestimonials = ({
  testimonials,
  autoplay = false,
  labels,
  placeholderLabel,
}: {
  testimonials: Testimonial[];
  autoplay?: boolean;
  labels: { previous: string; next: string };
  placeholderLabel: (src: string) => string;
}) => {
  const [active, setActive] = useState(0);
  const reduced = useReducedMotion();

  const handleNext = useCallback(() => setActive((prev) => (prev + 1) % testimonials.length), [testimonials.length]);
  const handlePrev = () => setActive((prev) => (prev - 1 + testimonials.length) % testimonials.length);

  useEffect(() => {
    if (!autoplay || reduced) return;
    const interval = setInterval(handleNext, 6000);
    return () => clearInterval(interval);
  }, [autoplay, reduced, handleNext, active]);

  const current = testimonials[active];

  return (
    <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2 md:gap-20">
      <div className="relative mx-auto aspect-square w-full max-w-[420px]">
        <AnimatePresence>
          {testimonials.map((t, index) => {
            const isActive = index === active;
            const tilt = TILTS[index % TILTS.length];
            return (
              <motion.div
                key={t.src}
                initial={{ opacity: 0, scale: 0.9, z: -100, rotate: tilt }}
                animate={{
                  opacity: isActive ? 1 : 0.6,
                  scale: isActive ? 1 : 0.94,
                  z: isActive ? 0 : -100,
                  rotate: isActive ? 0 : tilt,
                  zIndex: isActive ? 40 : testimonials.length + 2 - index,
                  y: isActive && !reduced ? [0, -60, 0] : 0,
                }}
                exit={{ opacity: 0, scale: 0.9, z: 100, rotate: tilt }}
                transition={{ duration: reduced ? 0 : 0.4, ease: "easeInOut" }}
                className="absolute inset-0 origin-bottom overflow-hidden rounded-[24px] border border-line bg-surface-2"
                aria-hidden={!isActive}
              >
                {t.available ? (
                  <Image
                    src={t.src}
                    alt={t.name}
                    fill
                    sizes="420px"
                    draggable={false}
                    className="object-cover"
                    style={{ objectPosition: t.position ?? "50% 50%" }}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-end p-5">
                    <div aria-hidden className="layer-lines absolute inset-0 !h-full opacity-60 [mask-image:linear-gradient(to_top,black,transparent_70%)]" />
                    <span className="relative font-mono text-[11px] text-text-muted">{placeholderLabel(`public${t.src}`)}</span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <div className="flex flex-col gap-10">
        <motion.figure
          key={active}
          initial={{ y: reduced ? 0 : 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          aria-live="polite"
        >
          <figcaption>
            <p className="font-heading text-2xl text-pei">{current.name}</p>
            <p className="mt-1 text-sm text-text-muted">{current.designation}</p>
          </figcaption>
          <blockquote className="prose-body mt-8 text-lg leading-relaxed text-text md:text-xl">
            {current.quote.split(" ").map((word, index) => (
              <motion.span
                key={index}
                initial={reduced ? false : { filter: "blur(8px)", opacity: 0, y: 5 }}
                animate={{ filter: "blur(0px)", opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut", delay: 0.02 * index }}
                className="inline-block"
              >
                {word}&nbsp;
              </motion.span>
            ))}
          </blockquote>
        </motion.figure>
        <div className="flex gap-3">
          {[
            { onClick: handlePrev, label: labels.previous, Icon: IconArrowLeft, hover: "group-hover/button:-translate-x-0.5" },
            { onClick: handleNext, label: labels.next, Icon: IconArrowRight, hover: "group-hover/button:translate-x-0.5" },
          ].map(({ onClick, label, Icon, hover }) => (
            <button
              key={label}
              type="button"
              onClick={onClick}
              aria-label={label}
              className="group/button flex h-11 w-11 items-center justify-center rounded-full bg-molten text-on-molten transition-[transform,background-color] hover:bg-molten-hover active:scale-[0.97]"
            >
              <Icon className={cn("h-5 w-5 transition-transform duration-300", hover)} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
