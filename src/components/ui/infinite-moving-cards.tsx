"use client";
// Aceternity UI — Infinite Moving Cards, restyled and reworked: the loop copy
// is rendered by React (not cloned into the DOM) and hidden from screen
// readers, it pauses on hover or keyboard focus, and under reduced motion it
// becomes a plain horizontally scrollable row.

import { cn } from "@/lib/utils";
import React from "react";

export interface MovingCardItem {
  quote: string;
  name: string;
  title: string;
  rating?: number;
}

const DURATION = { fast: "30s", normal: "50s", slow: "80s" } as const;

export const InfiniteMovingCards = ({
  items,
  direction = "left",
  speed = "normal",
  pauseOnHover = true,
  className,
  ratingLabel,
}: {
  items: MovingCardItem[];
  direction?: "left" | "right";
  speed?: keyof typeof DURATION;
  pauseOnHover?: boolean;
  className?: string;
  ratingLabel: (rating: number) => string;
}) => {
  return (
    <div
      className={cn(
        "scroller group/scroller relative w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,white_12%,white_88%,transparent)]",
        "motion-reduce:overflow-x-auto motion-reduce:[mask-image:none]",
        className,
      )}
    >
      <div
        // Set per row: a CSS variable inside the theme's animation value would
        // be resolved once at :root, so every row would share it.
        style={{ animationDuration: DURATION[speed], animationDirection: direction === "left" ? "normal" : "reverse" }}
        className={cn(
          "flex w-max gap-4 py-2 animate-marquee motion-reduce:animate-none",
          pauseOnHover && "group-hover/scroller:[animation-play-state:paused] group-focus-within/scroller:[animation-play-state:paused]",
        )}
      >
        {[0, 1].map((copy) => (
          <ul key={copy} className="flex shrink-0 gap-4" aria-hidden={copy === 1 || undefined}>
            {items.map((item) => (
              <li
                key={`${copy}-${item.name}`}
                className="relative flex w-[300px] shrink-0 flex-col justify-between gap-6 rounded-[20px] border border-line bg-surface px-6 py-6 transition-colors hover:border-pei/40 md:w-[400px] md:px-8"
              >
                <blockquote className="flex flex-col gap-4">
                  {item.rating ? (
                    <span className="flex gap-0.5 text-molten" aria-label={ratingLabel(item.rating)} role="img">
                      {Array.from({ length: 5 }, (_, i) => (
                        <svg key={i} viewBox="0 0 20 20" className={cn("h-4 w-4", i >= item.rating! && "opacity-25")} fill="currentColor" aria-hidden>
                          <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.5 7.7l5.9-.9L10 1.5z" />
                        </svg>
                      ))}
                    </span>
                  ) : null}
                  <p className="text-[15px] leading-relaxed text-text">&ldquo;{item.quote}&rdquo;</p>
                </blockquote>
                <div className="flex items-center gap-3">
                  <span aria-hidden className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface-2 font-heading text-sm text-pei">
                    {item.name.slice(0, 1)}
                  </span>
                  <span className="flex flex-col">
                    <span className="text-sm font-medium text-text">{item.name}</span>
                    <span className="text-xs text-text-muted">{item.title}</span>
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
};
