"use client";
// Aceternity UI — World Map, adapted: the dotted map is pre-generated
// (scripts/generate-world-map.mjs) and drawn as a CSS mask, so it takes the
// theme's colour with no runtime map library. Routes draw once when the map
// scrolls into view; reduced motion shows them drawn, without pulses.
import { useId } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

export interface MapPoint {
  lat: number;
  lng: number;
  label?: string;
}

/** Must match scripts/generate-world-map.mjs (Mercator, dotted-map defaults). */
const MAP = { width: 198, height: 100, lat: { min: -56, max: 71 }, lng: { min: -168, max: 168 } };
const VIEW = { width: 800, height: (800 * MAP.height) / MAP.width };

const mercator = (lat: number) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
const Y_TOP = mercator(MAP.lat.max);
const Y_RANGE = Y_TOP - mercator(MAP.lat.min);

export function projectPoint(lat: number, lng: number) {
  const x = ((lng - MAP.lng.min) / (MAP.lng.max - MAP.lng.min)) * VIEW.width;
  const y = ((Y_TOP - mercator(lat)) / Y_RANGE) * VIEW.height;
  return { x, y };
}

function curvedPath(start: { x: number; y: number }, end: { x: number; y: number }) {
  const midX = (start.x + end.x) / 2;
  const lift = Math.min(90, 20 + Math.hypot(end.x - start.x, end.y - start.y) * 0.25);
  const midY = Math.min(start.y, end.y) - lift;
  return `M ${start.x} ${start.y} Q ${midX} ${midY} ${end.x} ${end.y}`;
}

export default function WorldMap({
  origin,
  destinations,
  lineColor = "var(--color-molten)",
  className,
  label,
}: {
  origin: MapPoint;
  destinations: MapPoint[];
  lineColor?: string;
  className?: string;
  /** Accessible description of the map. */
  label: string;
}) {
  const id = useId().replace(/:/g, "");
  const reduced = useReducedMotion();
  const start = projectPoint(origin.lat, origin.lng);

  return (
    <div className={cn("relative w-full select-none", className)} style={{ aspectRatio: `${VIEW.width} / ${VIEW.height}` }}>
      {/* Dots: the pre-generated SVG used as a mask over a themed fill. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-text/25"
        style={{
          maskImage: "url(/map/world-dots.svg)",
          WebkitMaskImage: "url(/map/world-dots.svg)",
          maskSize: "100% 100%",
          WebkitMaskSize: "100% 100%",
        }}
      />
      <svg viewBox={`0 0 ${VIEW.width} ${VIEW.height}`} className="absolute inset-0 h-full w-full overflow-visible" role="img" aria-label={label}>
        <defs>
          <linearGradient id={`${id}-route`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: lineColor }} stopOpacity="0" />
            <stop offset="8%" style={{ stopColor: lineColor }} stopOpacity="1" />
            <stop offset="92%" style={{ stopColor: lineColor }} stopOpacity="1" />
            <stop offset="100%" style={{ stopColor: lineColor }} stopOpacity="0" />
          </linearGradient>
        </defs>

        {destinations.map((dest, i) => {
          const end = projectPoint(dest.lat, dest.lng);
          return (
            <motion.path
              key={`route-${i}`}
              d={curvedPath(start, end)}
              fill="none"
              stroke={`url(#${id}-route)`}
              strokeWidth="1.2"
              initial={{ pathLength: reduced ? 1 : 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 1.1, delay: 0.25 * i, ease: "easeOut" }}
            />
          );
        })}

        {[origin, ...destinations].map((point, i) => {
          const p = projectPoint(point.lat, point.lng);
          const isOrigin = i === 0;
          return (
            <g key={`point-${i}`}>
              <circle cx={p.x} cy={p.y} r={isOrigin ? 3.2 : 2.2} style={{ fill: lineColor }} />
              {!reduced && (
                <circle cx={p.x} cy={p.y} r="2" style={{ fill: lineColor }} opacity="0.5">
                  <animate attributeName="r" from="2" to={isOrigin ? "12" : "8"} dur="1.6s" begin={`${(i * 0.3) % 1.6}s`} repeatCount="indefinite" />
                  <animate attributeName="opacity" from="0.5" to="0" dur="1.6s" begin={`${(i * 0.3) % 1.6}s`} repeatCount="indefinite" />
                </circle>
              )}
              {point.label && (
                <text
                  x={p.x + 6}
                  y={p.y - 6}
                  className={cn("font-machine", isOrigin ? "fill-text" : "fill-text-muted")}
                  style={{ fontSize: isOrigin ? 11 : 9 }}
                >
                  {point.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
