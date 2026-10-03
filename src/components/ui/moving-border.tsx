"use client";
// Aceternity UI — Moving Border, restyled: a molten glow travelling around a
// pill (nozzle-tip) button. Used on two buttons only across the whole site.
import React from "react";
import {
  motion,
  useAnimationFrame,
  useMotionTemplate,
  useMotionValue,
  useTransform,
} from "motion/react";
import { useRef } from "react";
import { cn } from "@/lib/utils";

type ButtonProps = {
  borderRadius?: string;
  children: React.ReactNode;
  as?: React.ElementType;
  containerClassName?: string;
  borderClassName?: string;
  duration?: number;
  className?: string;
  /** When false the glow stops travelling and the border sits still. */
  animate?: boolean;
  [key: string]: unknown;
};

type AnyComponent = React.ComponentType<Record<string, unknown> & { children?: React.ReactNode }>;

export function Button({
  borderRadius = "999px",
  children,
  as,
  containerClassName,
  borderClassName,
  duration,
  className,
  animate = true,
  ...otherProps
}: ButtonProps) {
  const Component = (as ?? "button") as unknown as AnyComponent;
  return (
    <Component
      className={cn(
        "group/moving relative inline-flex h-12 overflow-hidden bg-transparent p-px text-base transition-transform duration-150 active:scale-[0.97]",
        containerClassName,
      )}
      style={{ borderRadius }}
      {...otherProps}
    >
      <div className="absolute inset-0" style={{ borderRadius }}>
        {animate ? (
          <MovingBorder duration={duration} rx="30%" ry="30%">
            <div
              className={cn(
                "h-16 w-16 bg-[radial-gradient(var(--color-molten)_40%,transparent_60%)] opacity-90",
                borderClassName,
              )}
            />
          </MovingBorder>
        ) : (
          <div className="absolute inset-0 bg-molten/70" style={{ borderRadius }} />
        )}
      </div>

      <div
        className={cn(
          "relative flex h-full w-full items-center justify-center border border-line bg-surface/95 px-6 text-sm font-medium text-text antialiased transition-colors group-hover/moving:bg-surface-2",
          className,
        )}
        style={{ borderRadius }}
      >
        {children}
      </div>
    </Component>
  );
}

export const MovingBorder = ({
  children,
  duration = 3600,
  rx,
  ry,
  ...otherProps
}: {
  children: React.ReactNode;
  duration?: number;
  rx?: string;
  ry?: string;
} & React.SVGProps<SVGSVGElement>) => {
  const pathRef = useRef<SVGRectElement>(null);
  const progress = useMotionValue<number>(0);

  useAnimationFrame((time) => {
    const length = pathRef.current?.getTotalLength();
    if (length) {
      const pxPerMillisecond = length / duration;
      progress.set((time * pxPerMillisecond) % length);
    }
  });

  const x = useTransform(progress, (val) => pathRef.current?.getPointAtLength(val).x ?? 0);
  const y = useTransform(progress, (val) => pathRef.current?.getPointAtLength(val).y ?? 0);

  const transform = useMotionTemplate`translateX(${x}px) translateY(${y}px) translateX(-50%) translateY(-50%)`;

  return (
    <>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        className="absolute h-full w-full"
        width="100%"
        height="100%"
        aria-hidden
        {...otherProps}
      >
        <rect fill="none" width="100%" height="100%" rx={rx} ry={ry} ref={pathRef} />
      </svg>
      <motion.div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          display: "inline-block",
          transform,
        }}
      >
        {children}
      </motion.div>
    </>
  );
};
