"use client";

import { useRef } from "react";
import { useIsMobile } from "@/lib/useReducedMotion";
import { DraggableCardBody, DraggableCardContainer } from "@/components/ui/draggable-card";
import { challenge } from "@/content/challenge";
import { challengeCopy, cursorCopy } from "@/content/site";
import { cursorProps } from "@/lib/cursor";
import { cn } from "@/lib/utils";

/** Instagram's embed renders at 326px wide: a 54px header, then the reel. */
const EMBED = { width: 326, height: 616, visible: 462 };

/**
 * Size, position and tilt per reel, newest first. Sizes differ on purpose,
 * like prints of different heights on the bench.
 */
const LAYOUT = [
  { scale: 1, place: "left-[0%] top-[4%] rotate-[-3deg]" },
  { scale: 0.84, place: "left-[24%] top-[0%] rotate-[4deg]" },
  { scale: 0.76, place: "left-[44%] top-[14%] rotate-[-2deg]" },
  { scale: 0.9, place: "left-[60%] top-[2%] rotate-[3deg]" },
  { scale: 0.8, place: "left-[78%] top-[12%] rotate-[-4deg]" },
];

/** Phone pile: cards zig-zag left and right, each overlapping the one above. */
const MOBILE_LAYOUT = [
  { scale: 0.74, place: "left-0 top-0 rotate-[-3deg]" },
  { scale: 0.68, place: "right-0 top-[11rem] rotate-[4deg]" },
  { scale: 0.72, place: "left-[2%] top-[22rem] rotate-[-2deg]" },
  { scale: 0.66, place: "right-[2%] top-[33rem] rotate-[3deg]" },
  { scale: 0.7, place: "left-[4%] top-[44rem] rotate-[-4deg]" },
];

export function Challenge() {
  const pileRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const latest = challenge.reels[0]?.day ?? 0;
  const pct = Math.min(100, (latest / challenge.totalDays) * 100);

  return (
    <section id="challenge" aria-labelledby="challenge-heading" className="section-pad overflow-x-clip" {...cursorProps(cursorCopy.challenge)}>
      <div className="container-site">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12 md:items-end">
          <div className="md:col-span-7">
            <h2 id="challenge-heading" className="font-heading text-[length:var(--text-heading)] text-text">
              {challengeCopy.heading}
            </h2>
            <p className="prose-body mt-4 text-lg text-text-muted">{challengeCopy.sub}</p>
          </div>
          <div className="flex flex-col gap-4 md:col-span-5 md:items-end">
            {/* Progress as a strip of layer lines, filled up to today. */}
            <div className="w-full max-w-sm">
              <div className="flex items-baseline justify-between">
                <span className="font-machine text-sm text-text">{challengeCopy.progress(latest, challenge.totalDays)}</span>
                <span className="font-machine text-xs text-text-muted">{challenge.goal}</span>
              </div>
              <div
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={challenge.totalDays}
                aria-valuenow={latest}
                aria-label={challengeCopy.progress(latest, challenge.totalDays)}
                className="relative mt-2 h-2 overflow-hidden rounded-full bg-line"
              >
                <div className="absolute inset-y-0 left-0 rounded-full bg-molten" style={{ width: `${pct}%` }} />
              </div>
            </div>
            <a
              href={challenge.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-text underline decoration-line underline-offset-[6px] transition-colors hover:decoration-pei"
            >
              {challengeCopy.follow}
              <span className="sr-only"> ({challenge.handle})</span>
            </a>
          </div>
        </div>

        <p className="mt-8 text-sm text-text-muted md:mt-14">{isMobile ? challengeCopy.dragHintMobile : challengeCopy.dragHint}</p>
        {/* A scattered pile of reels. On phones, cards drag by their "Day"
            strip only, so the page still scrolls and videos stay tappable. */}
        <DraggableCardContainer ref={pileRef} className="relative mt-4 h-[70rem] w-full md:h-[38rem]">
          {challenge.reels.slice(0, LAYOUT.length).map((reel, i) => {
            const { scale, place } = isMobile ? MOBILE_LAYOUT[i] : LAYOUT[i];
            return (
              <div key={reel.code} className={cn("absolute", place)}>
                <DraggableCardBody
                  constraintsRef={pileRef}
                  handle={isMobile ? "[data-drag-handle]" : undefined}
                  className="w-auto p-2 md:w-auto"
                >
                  <ReelCard reel={reel} scale={scale} />
                </DraggableCardBody>
              </div>
            );
          })}
        </DraggableCardContainer>
      </div>
    </section>
  );
}

type Reel = (typeof challenge.reels)[number];

/** Day label strip plus the Instagram embed, scaled to `scale`. */
function ReelCard({ reel, scale }: { reel: Reel; scale: number }) {
  return (
    <>
      {/* The label strip is the drag handle; the video below stays playable. */}
      <div data-drag-handle className="flex touch-none items-center justify-between px-2 pb-2 pt-1" {...cursorProps(cursorCopy.challengeCard)}>
        <span className="font-heading text-base text-text">{challengeCopy.dayLabel(reel.day)}</span>
        <span className="font-machine text-xs text-text-muted">{reel.date}</span>
      </div>
      <div className="overflow-hidden rounded-[12px] bg-surface-2" style={{ width: EMBED.width * scale, height: EMBED.visible * scale }}>
        <iframe
          src={`https://www.instagram.com/reel/${reel.code}/embed/`}
          title={challengeCopy.reelTitle(reel.day)}
          width={EMBED.width}
          height={EMBED.height}
          loading="lazy"
          scrolling="no"
          allow="autoplay; encrypted-media; picture-in-picture; clipboard-write"
          className="block border-0"
          style={{ transform: `scale(${scale})`, transformOrigin: "0 0" }}
        />
      </div>
    </>
  );
}
