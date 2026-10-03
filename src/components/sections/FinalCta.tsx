"use client";

import { cursorProps } from "@/lib/cursor";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { MoltenButton } from "@/components/shared/Button";
import { ModelSlot } from "@/components/three/ModelSlot";
import { ctaCopy, cursorCopy } from "@/content/site";

export function FinalCta() {
  return (
    <section aria-labelledby="cta-heading" className="relative overflow-hidden section-pad" {...cursorProps(cursorCopy.cta)}>
      <BackgroundBeams className="opacity-[0.15] motion-reduce:hidden" />
      {/* Slowly rotating object behind the text, dimmed to 35%. Centred with
          margins, not transforms, so the dimming layer stays above the canvas. */}
      <ModelSlot
        id="cta-object"
        dim={0.65}
        className="pointer-events-none absolute left-1/2 top-1/2 -ml-[min(45vw,310px)] -mt-[min(45vw,310px)] h-[min(90vw,620px)] w-[min(90vw,620px)]"
      />
      <div className="container-site relative z-40 flex flex-col items-center py-12 text-center md:py-20">
        <h2 id="cta-heading" className="font-display text-[length:var(--text-display)] text-text">
          {ctaCopy.headline.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </h2>
        <MoltenButton href={ctaCopy.button.href} className="mt-10">
          {ctaCopy.button.label}
        </MoltenButton>
      </div>
    </section>
  );
}
