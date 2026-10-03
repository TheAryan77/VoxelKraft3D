"use client";
// Aceternity UI — Focus Cards, restyled and generalised: hover or focus one
// card and the others blur and dim. Cards are rendered by the caller.
import React, { useState } from "react";
import { cn } from "@/lib/utils";

export function FocusCards<T>({
  items,
  getKey,
  renderCard,
  className,
}: {
  items: T[];
  getKey: (item: T) => string;
  renderCard: (item: T, state: { index: number; focused: boolean }) => React.ReactNode;
  className?: string;
}) {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <ul
      className={cn("grid w-full grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3", className)}
      onMouseLeave={() => setHovered(null)}
    >
      {items.map((item, index) => (
        <li
          key={getKey(item)}
          onMouseEnter={() => setHovered(index)}
          onFocus={() => setHovered(index)}
          onBlur={() => setHovered(null)}
          className={cn(
            "transition-[filter,opacity,transform] duration-300 ease-out",
            hovered !== null && hovered !== index && "scale-[0.98] opacity-60 blur-[3px]",
          )}
        >
          {renderCard(item, { index, focused: hovered === index })}
        </li>
      ))}
    </ul>
  );
}
