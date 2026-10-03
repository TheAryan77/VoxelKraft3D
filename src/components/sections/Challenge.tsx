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
/** Phone swipe-row size: 326 × 0.8 ≈ 260px wide cards. */
const MOBILE_SCALE = 0.8;

/**
 * Size, position and tilt per reel, newest first. Sizes differ on purpose,
 * like prints of different heights on the bench. Mobile pile, then desktop row.
 */
const LAYOUT = [
  { scale: 1, place: "left-[0%] top-[0%] rotate-[-3deg] md:left-[0%] md:top-[4%]" },
  { scale: 0.84, place: "left-[8%] top-[21%] rotate-[4deg] md:left-[24%] md:top-[0%]" },
  { scale: 0.76, place: "left-[2%] top-[40%] rotate-[-2deg] md:left-[44%] md:top-[14%]" },
  { scale: 0.9, place: "left-[10%] top-[58%] rotate-[3deg] md:left-[60%] md:top-[2%]" },
  { scale: 0.8, place: "left-[4%] top-[78%] rotate-[-4deg] md:left-[78%] md:top-[12%]" },
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

        {isMobile ? (
          <>
            <p className="mt-8 text-sm text-text-muted">{challengeCopy.swipeHint}</p>
            {/* Phones: a swipe row, all reels the same size. Dragging a card
                would fight the page scroll, so there's no pile here. */}
            <ul className="no-scrollbar -mx-5 mt-4 flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto px-5 pb-2">
              {challenge.reels.map((reel) => (
                <li key={reel.code} className="shrink-0 snap-start rounded-[20px] border border-line bg-surface p-2">
                  <ReelCard reel={reel} scale={MOBILE_SCALE} />
                </li>
              ))}
            </ul>
          </>
        ) : (
          <>
            <p className="mt-10 text-sm text-text-muted md:mt-14">{challengeCopy.dragHint}</p>
            <DraggableCardContainer ref={pileRef} className="relative mt-4 h-[38rem] w-full">
              {challenge.reels.slice(0, LAYOUT.length).map((reel, i) => {
                const { scale, place } = LAYOUT[i];
                return (
                  <div key={reel.code} className={cn("absolute", place)}>
                    <DraggableCardBody constraintsRef={pileRef} className="w-auto p-2 md:w-auto">
                      <ReelCard reel={reel} scale={scale} />
                    </DraggableCardBody>
                  </div>
                );
              })}
            </DraggableCardContainer>
          </>
        )}
      </div>
    </section>
  );
}

type Reel = (typeof challenge.reels)[number];

/** Day label strip plus the Instagram embed, scaled to `scale`. */
function ReelCard({ reel, scale }: { reel: Reel; scale: number }) {
  return (
    <>
      {/* On desktop the label strip is the drag handle; the video stays playable. */}
      <div className="flex items-center justify-between px-2 pb-2 pt-1" {...cursorProps(cursorCopy.challengeCard)}>
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
