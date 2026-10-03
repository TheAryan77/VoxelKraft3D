"use client";

import WorldMap from "@/components/ui/world-map";
import { destinations, origin } from "@/content/delivery";
import { cursorCopy, deliveryCopy } from "@/content/site";
import { cursorProps } from "@/lib/cursor";
import { SectionHeading } from "./SectionHeading";

export function Delivery() {
  return (
    <section id="delivery" aria-labelledby="delivery-heading" className="section-pad overflow-x-clip" {...cursorProps(cursorCopy.delivery)}>
      <div className="container-site">
        <SectionHeading id="delivery-heading" title={deliveryCopy.heading} sub={deliveryCopy.sub} />
        <WorldMap origin={origin} destinations={destinations} label={deliveryCopy.mapLabel} />
      </div>
    </section>
  );
}
