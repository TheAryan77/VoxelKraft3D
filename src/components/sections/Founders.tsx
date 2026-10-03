"use client";

import { AnimatedTestimonials } from "@/components/ui/animated-testimonials";
import { founders } from "@/content/founders";
import { cursorCopy, foundersCopy, placeholderCopy } from "@/content/site";
import { cursorProps } from "@/lib/cursor";
import { SectionHeading } from "./SectionHeading";

export function Founders({ photos }: { photos: Record<string, boolean> }) {
  return (
    <section id="founders" aria-labelledby="founders-heading" className="section-pad" {...cursorProps(cursorCopy.founders)}>
      <div className="container-site">
        <SectionHeading id="founders-heading" title={foundersCopy.heading} sub={foundersCopy.sub} />
        <AnimatedTestimonials
          testimonials={founders.map((f) => ({ ...f, available: photos[f.src] }))}
          labels={{ previous: foundersCopy.previous, next: foundersCopy.next }}
          placeholderLabel={placeholderCopy.photoMissing}
        />
      </div>
    </section>
  );
}
