"use client";
// Aceternity UI — Text Hover Effect, restyled: Archivo expanded outline in the
// hairline colour, a molten-to-bronze gradient revealed around the cursor, and
// the outline draws itself the first time it scrolls into view (not on load,
// since it sits at the very bottom of the page). Static under reduced motion.
import React, { useEffect, useId, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

export const TextHoverEffect = ({
  text,
  duration,
  className,
}: {
  text: string;
  duration?: number;
  className?: string;
}) => {
  const id = useId().replace(/:/g, "");
  const svgRef = useRef<SVGSVGElement>(null);
  const reduced = useReducedMotion();
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);
  const [maskPosition, setMaskPosition] = useState({ cx: "50%", cy: "50%" });

  useEffect(() => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    setMaskPosition({
      cx: `${((cursor.x - rect.left) / rect.width) * 100}%`,
      cy: `${((cursor.y - rect.top) / rect.height) * 100}%`,
    });
  }, [cursor]);

  const textProps = {
    x: "50%",
    y: "54%",
    textAnchor: "middle" as const,
    dominantBaseline: "middle" as const,
    textLength: "94%",
    lengthAdjust: "spacingAndGlyphs" as const,
    style: { fontFamily: "var(--font-display)", fontStretch: "125%", fontWeight: 800, fontSize: 150 },
  };

  return (
    <svg
      ref={svgRef}
      width="100%"
      viewBox="0 0 1000 200"
      xmlns="http://www.w3.org/2000/svg"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onMouseMove={(e) => setCursor({ x: e.clientX, y: e.clientY })}
      className={`select-none ${className ?? ""}`}
      role="img"
      aria-label={text}
    >
      <defs>
        <linearGradient id={`${id}-grad`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="1000" y2="0">
          <stop offset="0%" stopColor="#ffb27a" />
          <stop offset="35%" stopColor="#ff6a13" />
          <stop offset="70%" stopColor="#b8925a" />
          <stop offset="100%" stopColor="#ff6a13" />
        </linearGradient>
        <motion.radialGradient
          id={`${id}-reveal`}
          gradientUnits="userSpaceOnUse"
          r="22%"
          initial={{ cx: "50%", cy: "50%" }}
          animate={maskPosition}
          transition={{ duration: duration ?? 0, ease: "easeOut" }}
        >
          <stop offset="0%" stopColor="white" />
          <stop offset="100%" stopColor="black" />
        </motion.radialGradient>
        <mask id={`${id}-mask`}>
          <rect x="0" y="0" width="100%" height="100%" fill={`url(#${id}-reveal)`} />
        </mask>
      </defs>

      {/* Faint fill so the word reads even before hover. */}
      <text {...textProps} className="fill-text/[0.03]" strokeWidth="1">
        {text}
      </text>
      {/* Outline that draws itself once, in the hairline colour. */}
      <motion.text
        {...textProps}
        fill="transparent"
        strokeWidth="1.2"
        className="stroke-line"
        initial={reduced ? false : { strokeDashoffset: 3000, strokeDasharray: 3000 }}
        whileInView={{ strokeDashoffset: 0, strokeDasharray: 3000 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 4, ease: "easeInOut" }}
      >
        {text}
      </motion.text>
      {/* Gradient outline, revealed around the cursor. */}
      <text
        {...textProps}
        fill="transparent"
        stroke={`url(#${id}-grad)`}
        strokeWidth="1.6"
        mask={`url(#${id}-mask)`}
        style={{ ...textProps.style, opacity: hovered ? 1 : 0, transition: "opacity 300ms ease" }}
      >
        {text}
      </text>
    </svg>
  );
};
