"use client";

import { cursorProps } from "@/lib/cursor";
import { useState } from "react";
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { ModelSlot } from "@/components/three/ModelSlot";
import { services, type Service } from "@/content/services";
import { cursorCopy, servicesCopy } from "@/content/site";
import { prefillQuote } from "@/lib/sceneStore";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { cn } from "@/lib/utils";
import { SectionHeading } from "./SectionHeading";

export function Services() {
  return (
    <section id="services" aria-labelledby="services-heading" className="section-pad" {...cursorProps(cursorCopy.services)}>
      <div className="container-site">
        <SectionHeading id="services-heading" title={servicesCopy.heading} sub={servicesCopy.sub} className="mb-8 md:mb-16" />
        <p className="mb-4 text-sm text-text-muted md:hidden">{servicesCopy.swipeHint}</p>
        {/* Phones: a swipe row with the next tile peeking in. Desktop: the bento grid. */}
        <BentoGrid className="no-scrollbar -mx-5 flex snap-x snap-mandatory scroll-px-5 overflow-x-auto px-5 pb-2 md:mx-0 md:grid md:overflow-visible md:px-0 md:pb-0">
          {services.map((service) => (
            <ServiceTile key={service.id} service={service} />
          ))}
        </BentoGrid>
      </div>
    </section>
  );
}

function ServiceTile({ service }: { service: Service }) {
  const [hovered, setHovered] = useState(false);
  const reduced = useReducedMotion();

  return (
    <BentoGridItem
      className={cn("w-[82vw] max-w-[340px] shrink-0 snap-start md:w-auto md:max-w-none", service.span === 2 && "md:col-span-2")}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      header={
        <>
          <GlowingEffect
            variant="pei"
            spread={40}
            glow
            disabled={reduced}
            proximity={64}
            inactiveZone={0.01}
            borderWidth={1}
          />
          <ModelSlot
            id={service.modelId}
            active={hovered}
            className="h-[15rem] w-full shrink-0 overflow-hidden rounded-[14px] bg-surface-2/60 md:h-[65%]"
          />
        </>
      }
      title={service.title}
      description={service.description}
      footer={
        <a
          href="#quote"
          onClick={() => prefillQuote({ category: service.id })}
          className="inline-flex text-sm font-medium text-text underline decoration-line underline-offset-[6px] transition-colors hover:decoration-pei"
        >
          {servicesCopy.askLabel}
          <span className="sr-only">: {service.title}</span>
        </a>
      }
    />
  );
}
