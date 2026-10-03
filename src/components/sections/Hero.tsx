"use client";

import { cursorProps } from "@/lib/cursor";
import { useEffect, useRef, useState } from "react";
import { Spotlight } from "@/components/ui/spotlight";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { LayerReveal } from "@/components/shared/LayerReveal";
import { MovingBorderLink, TextButton } from "@/components/shared/Button";
import { ModelSlot } from "@/components/three/ModelSlot";
import { cursorCopy, hero } from "@/content/site";
import { heroCtaVisible, heroPrintStart, startHeroPrint } from "@/lib/sceneStore";
import { useStore } from "@/lib/store";
import { useIsMobile, useReducedMotion } from "@/lib/useReducedMotion";
import { cn } from "@/lib/utils";

/** If the 3D scene isn't ready by then, the headline starts on its own. */
const START_FALLBACK_MS = 1500;
/** 8 slices × 40ms per line, plus a short beat between lines. */
const LINE_MS = 320;
const LINE_GAP_MS = 90;
const LEAD_IN_MS = 120;
/** Hero model fills more of its stage and sits a little higher. */
const HERO_FRAMING = { margin: 0.94, lift: 0.07 };
/** On phones the stage is short and wide, so the castle fills the width. */
const HERO_FRAMING_MOBILE = { margin: 0.9, lift: 0.02 };
/** The 3D area reaches past the stage (under the headline, to the page edge). */
// Shifted right on wide screens; narrower screens keep less room on the right
// so the spinning castle never touches the screen edge.
const HERO_BLEED =
  "md:-left-[30%] md:-right-[10%] md:-top-[14%] md:-bottom-[8%] xl:-left-[25%] xl:-right-[15%] min-[1400px]:-left-[20%] min-[1400px]:-right-[22%]";

export function Hero() {
  const started = useStore(heroPrintStart, null) !== null;
  const reduced = useReducedMotion();
  const isMobile = useIsMobile();
  const [headlineDone, setHeadlineDone] = useState(false);
  const ctaRef = useRef<HTMLDivElement>(null);

  // The print and the headline share one timeline: it starts when the hero
  // model is ready (PrintReveal calls startHeroPrint), or after a fallback.
  useEffect(() => {
    const t = window.setTimeout(startHeroPrint, START_FALLBACK_MS);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!started) return;
    const total = LEAD_IN_MS + hero.headline.length * (LINE_MS + LINE_GAP_MS);
    const t = window.setTimeout(() => setHeadlineDone(true), reduced ? 0 : total);
    return () => window.clearTimeout(t);
  }, [started, reduced]);

  useEffect(() => {
    const el = ctaRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => heroCtaVisible.set(entry.isIntersecting));
    io.observe(el);
    return () => {
      io.disconnect();
      heroCtaVisible.set(false);
    };
  }, []);

  const showRest = headlineDone || reduced;

  return (
    <section aria-labelledby="hero-heading" className="relative overflow-x-clip" {...cursorProps(cursorCopy.hero)}>
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-50 light:opacity-80">
        <Spotlight className="-top-40 -left-24 md:-top-32 md:left-[12%]" fill="#FF6A13" />
      </div>

      <div className="container-site relative grid min-h-[100svh] grid-cols-1 content-center gap-5 pb-8 pt-20 md:grid-cols-12 md:gap-8 md:pb-10 md:gap-x-6 md:gap-y-4 md:pt-28">
        {/* Model stage: above the text on mobile, 7/12 on desktop. No radius. */}
        <div {...cursorProps(cursorCopy.heroModel)} className="relative h-[42svh] min-h-[280px] md:min-h-0 md:col-span-7 md:col-start-6 md:row-start-1 md:-mr-6 md:-mt-14 md:h-[min(86vh,840px)] lg:-mr-12">
          <BuildPlate />
          <ModelSlot
            id="hero-print"
            mode="print-reveal"
            hotend
            parallax
            framing={isMobile ? HERO_FRAMING_MOBILE : HERO_FRAMING}
            bleed={HERO_BLEED}
            className="absolute inset-0"
          />
        </div>

        {/* z-40 keeps the text above the canvas where the model's area overlaps it. */}
        <div className="relative z-40 flex flex-col justify-center md:col-span-5 md:col-start-1 md:row-start-1">
          <h1 id="hero-heading" className="font-display text-[length:var(--text-hero)] text-text">
            {hero.headline.map((line, i) => (
              <LayerReveal
                key={line}
                as="span"
                className="-mb-[0.16em] block pb-[0.16em]"
                play={started}
                delay={reduced ? 0 : LEAD_IN_MS + i * (LINE_MS + LINE_GAP_MS)}
              >
                {line}
              </LayerReveal>
            ))}
          </h1>

          <TextGenerateEffect
            words={hero.subline}
            play={showRest}
            className="mt-4 max-w-[34ch] text-base leading-relaxed md:mt-6 md:text-xl"
          />

          <div
            ref={ctaRef}
            className={cn(
              "mt-7 flex flex-wrap items-center gap-x-8 gap-y-4 transition-opacity duration-700 md:mt-10",
              showRest ? "opacity-100" : "opacity-0",
            )}
          >
            <MovingBorderLink href={hero.primaryCta.href}>{hero.primaryCta.label}</MovingBorderLink>
            <TextButton href={hero.secondaryCta.href}>{hero.secondaryCta.label}</TextButton>
          </div>
        </div>

        {/* Machine-data strip */}
        <dl
          className={cn(
            "col-span-full mt-2 grid grid-cols-3 gap-3 border-t border-line pt-5 md:mt-4 md:gap-4 md:pt-6 md:row-start-2 transition-opacity delay-300 duration-700",
            showRest ? "opacity-100" : "opacity-0",
          )}
        >
          {hero.machineData.map((item) => (
            <div key={item.label} className="flex flex-col gap-1">
              <dt className="text-[11px] text-text-muted md:text-xs">{item.label}</dt>
              <dd className="font-machine break-words text-xs text-text md:text-sm">{item.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

/** Faint PEI build-plate speckle under the model, so it reads as the print bed. */
function BuildPlate() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-[6%] bottom-[2%] h-[38%] opacity-[0.06]"
      style={{
        background:
          "radial-gradient(ellipse 50% 42% at 50% 62%, var(--color-pei) 0%, transparent 72%)",
        maskImage:
          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='s'><feTurbulence type='fractalNoise' baseFrequency='1.6' numOctaves='2'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 2.4 -0.9'/></filter><rect width='100%' height='100%' filter='url(%23s)'/></svg>\")",
        WebkitMaskImage:
          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='s'><feTurbulence type='fractalNoise' baseFrequency='1.6' numOctaves='2'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 2.4 -0.9'/></filter><rect width='100%' height='100%' filter='url(%23s)'/></svg>\")",
      }}
    />
  );
}
