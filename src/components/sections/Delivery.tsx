"use client";

import { useEffect, useRef } from "react";
import WorldMap, { projectPoint } from "@/components/ui/world-map";
import { destinations, origin } from "@/content/delivery";
import { cursorCopy, deliveryCopy } from "@/content/site";
import { cursorProps } from "@/lib/cursor";
import { SectionHeading } from "./SectionHeading";

export function Delivery() {
  const scrollerRef = useRef<HTMLDivElement>(null);

  // Phones: the map is drawn wider than the screen; start centred on the studio.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || el.scrollWidth <= el.clientWidth) return;
    const fraction = projectPoint(origin.lat, origin.lng).x / 800;
    el.scrollLeft = fraction * el.scrollWidth - el.clientWidth / 2;
  }, []);

  return (
    <section id="delivery" aria-labelledby="delivery-heading" className="section-pad overflow-x-clip" {...cursorProps(cursorCopy.delivery)}>
      <div className="container-site">
        <SectionHeading id="delivery-heading" title={deliveryCopy.heading} sub={deliveryCopy.sub} />
        <p className="-mt-6 mb-4 text-sm text-text-muted md:hidden">{deliveryCopy.swipeHint}</p>
        <div ref={scrollerRef} className="no-scrollbar -mx-5 overflow-x-auto px-5 md:mx-0 md:overflow-visible md:px-0">
          <div className="w-[230%] md:w-full">
            <WorldMap origin={origin} destinations={destinations} label={deliveryCopy.mapLabel} />
          </div>
        </div>
      </div>
    </section>
  );
}
