"use client";

import { InfiniteMovingCards } from "@/components/ui/infinite-moving-cards";
import { hasSampleReviews, reviews } from "@/content/reviews";
import { cursorCopy, reviewsCopy } from "@/content/site";
import { cursorProps } from "@/lib/cursor";
import { SectionHeading } from "./SectionHeading";

export function Reviews() {
  const items = reviews;
  if (items.length === 0) return null;
  // Two rows moving in opposite directions.
  const half = Math.ceil(items.length / 2);
  const rows = items.length >= 4 ? [items.slice(0, half), items.slice(half)] : [items];

  return (
    <section id="reviews" aria-labelledby="reviews-heading" className="section-pad overflow-x-clip" {...cursorProps(cursorCopy.reviews)}>
      <div className="container-site">
        <SectionHeading
          id="reviews-heading"
          title={reviewsCopy.heading}
          sub={reviewsCopy.sub}
          className={hasSampleReviews ? "mb-4 md:mb-6" : undefined}
        />
        {hasSampleReviews && (
          <p className="mb-8 inline-flex items-center gap-2 rounded-full border border-line px-3 py-1 text-xs text-text-muted md:mb-12">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-pei" />
            {reviewsCopy.sampleNote}
          </p>
        )}
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
