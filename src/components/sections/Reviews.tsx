"use client";

import { InfiniteMovingCards } from "@/components/ui/infinite-moving-cards";
import { visibleReviews } from "@/content/reviews";
import { cursorCopy, reviewsCopy } from "@/content/site";
import { cursorProps } from "@/lib/cursor";
import { SectionHeading } from "./SectionHeading";

export function Reviews() {
  const items = visibleReviews();
  if (items.length === 0) return null;
  // Two rows moving in opposite directions.
  const half = Math.ceil(items.length / 2);
  const rows = items.length >= 4 ? [items.slice(0, half), items.slice(half)] : [items];

  return (
    <section id="reviews" aria-labelledby="reviews-heading" className="section-pad overflow-x-clip" {...cursorProps(cursorCopy.reviews)}>
      <div className="container-site">
        <SectionHeading id="reviews-heading" title={reviewsCopy.heading} sub={reviewsCopy.sub} />
      </div>
      <div className="flex flex-col gap-4">
        {rows.map((row, i) => (
          <InfiniteMovingCards
            key={i}
            items={row}
            direction={i % 2 === 0 ? "left" : "right"}
            speed="normal"
            ratingLabel={reviewsCopy.ratingLabel}
          />
        ))}
      </div>
    </section>
  );
}
