"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  animate,
  motion,
  useInView,
  useMotionValue,
  useMotionValueEvent,
  useTransform,
  type AnimationPlaybackControls,
} from "motion/react";
import { IconArrowLeft, IconArrowRight, IconPlayerPauseFilled, IconPlayerPlayFilled } from "@tabler/icons-react";
import { SceneSlot } from "@/components/three/SceneSlot";
import { SectionHeading } from "./SectionHeading";
import { cursorProps } from "@/lib/cursor";
import { cursorCopy, journeyCopy } from "@/content/site";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { cn } from "@/lib/utils";

const STAGES = journeyCopy.stages;
const LAST = STAGES.length - 1;
/** Seconds to go from stage i to i + 1 (assemble, print, colour). */
const STEP_S = [1.9, 2.8, 2.1];
/** How long autoplay rests on each stage. */
const HOLD_MS = [2600, 2200, 2200, 3800];
const EASE = [0.45, 0, 0.25, 1] as const;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * "From idea to object": the same model at four stages, with arrows, a
 * scrubbable progress bar and autoplay. `progress` (0..3) is shared with the
 * 3D scene, which morphs continuously between stages.
 */
export function Journey() {
  const progress = useMotionValue(0);
  const [shown, setShown] = useState(0);
  const [target, setTarget] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [moving, setMoving] = useState(false);
  const reduced = useReducedMotion();
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const scrubbing = useRef(false);
  const anim = useRef<AnimationPlaybackControls | null>(null);
  const inView = useInView(section, { amount: 0.35 });
  const fill = useTransform(progress, (v) => `${(v / LAST) * 100}%`);

  useMotionValueEvent(progress, "change", (v) => setShown(clamp(Math.round(v), 0, LAST)));

  const stop = useCallback(() => {
    anim.current?.stop();
    anim.current = null;
    setMoving(false);
  }, []);

  const goTo = useCallback(
    (next: number, user = false) => {
      const to = clamp(next, 0, LAST);
      if (user) setPlaying(false);
      setTarget(to);
      anim.current?.stop();
      const from = progress.get();
      if (reduced || Math.abs(to - from) < 0.001) {
        progress.set(to);
        setMoving(false);
        return;
      }
      // Each stage change takes its own time; long jumps and rewinds go quicker.
      const lo = Math.min(from, to);
      const hi = Math.max(from, to);
      let duration = 0;
      for (let i = 0; i < LAST; i++) duration += Math.max(0, Math.min(hi, i + 1) - Math.max(lo, i)) * STEP_S[i];
      if (to < from) duration *= 0.45;
      else if (hi - lo > 1.01) duration *= 0.7;
      setMoving(true);
      anim.current = animate(progress, to, {
        duration: Math.max(0.35, duration),
        ease: EASE,
        onComplete: () => setMoving(false),
      });
    },
    [progress, reduced],
  );

  // Autoplay: rest on a stage, then move on; after the finished piece, start over.
  useEffect(() => {
    if (!playing || !inView || reduced || moving) return;
    const t = window.setTimeout(() => goTo(target === LAST ? 0 : target + 1), HOLD_MS[target]);
    return () => window.clearTimeout(t);
  }, [playing, inView, reduced, moving, target, goTo]);

  useEffect(() => () => anim.current?.stop(), []);

  /* Scrubbing: the track spans the centres of the four stage columns. */
  const valueAt = (clientX: number) => {
    const r = track.current!.getBoundingClientRect();
    return clamp(((clientX - r.left) / r.width) * LAST, 0, LAST);
  };
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    setPlaying(false);
    stop();
    scrubbing.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    progress.set(valueAt(e.clientX));
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (scrubbing.current) progress.set(valueAt(e.clientX));
  };
  const onPointerUp = () => {
    if (!scrubbing.current) return;
    scrubbing.current = false;
    // Stays where it was let go (half printed is a fine place to stop).
    setTarget(clamp(Math.round(progress.get()), 0, LAST));
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    const keys: Record<string, number> = { ArrowLeft: shown - 1, ArrowDown: shown - 1, ArrowRight: shown + 1, ArrowUp: shown + 1, Home: 0, End: LAST };
    if (!(e.key in keys)) return;
    e.preventDefault();
    goTo(keys[e.key], true);
  };

  const stage = STAGES[shown];

  return (
    <section ref={section} id="journey" aria-labelledby="journey-heading" className="section-pad overflow-x-clip">
      <div className="container-site">
        <p className="mb-3 font-machine text-xs uppercase tracking-[0.2em] text-molten">{journeyCopy.eyebrow}</p>
        <SectionHeading id="journey-heading" title={journeyCopy.heading} sub={journeyCopy.sub} className="mb-8 md:mb-12" />

        <div className="overflow-hidden rounded-[20px] border border-line bg-surface md:rounded-[24px]">
          <div className="grid grid-cols-1 md:grid-cols-12">
            {/* 3D stage */}
            <div className="relative h-[290px] sm:h-[380px] md:col-span-8 md:h-[470px]" {...cursorProps(cursorCopy.journey)}>
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{ background: "radial-gradient(60% 55% at 50% 58%, color-mix(in srgb, var(--color-molten) 9%, transparent), transparent 70%)" }}
              />
              <SceneSlot className="absolute inset-0" scene={{ kind: "journey", progress }} />
              <span className="pointer-events-none absolute left-4 top-4 z-40 rounded-full border border-line bg-bg/70 px-3 py-1 font-machine text-xs text-text backdrop-blur-sm md:left-6 md:top-6">
                {String(shown + 1).padStart(2, "0")} <span className="text-text-muted">/ {String(STAGES.length).padStart(2, "0")}</span>
              </span>
              <span className="pointer-events-none absolute bottom-3 right-4 z-40 text-[11px] text-text-muted md:bottom-5 md:right-6">{journeyCopy.dragHint}</span>
            </div>

            {/* Stage text and controls */}
            <div className="flex flex-col justify-between gap-6 border-t border-line p-5 md:col-span-4 md:border-l md:border-t-0 md:p-8">
              <div className="min-h-[7.5rem] md:min-h-0" aria-live="polite">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={shown}
                    initial={reduced ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduced ? undefined : { opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                  >
                    <p className="font-machine text-xs text-molten">{journeyCopy.stageOf(shown + 1, STAGES.length)}</p>
                    <h3 className="mt-2 font-heading text-2xl text-text md:text-3xl">{stage.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-text-muted md:text-base">{stage.body}</p>
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="flex items-center gap-2">
                <RoundButton label={journeyCopy.previous} onClick={() => goTo(shown - 1, true)} disabled={shown === 0 && !moving}>
                  <IconArrowLeft size={18} />
                </RoundButton>
                <RoundButton label={journeyCopy.next} onClick={() => goTo(shown + 1, true)} disabled={shown === LAST && !moving} accent>
                  <IconArrowRight size={18} />
                </RoundButton>
                {!reduced && (
                  <button
                    type="button"
                    onClick={() => setPlaying((p) => !p)}
                    aria-pressed={playing}
                    className="ml-auto inline-flex h-11 items-center gap-2 rounded-full px-3 text-sm text-text-muted transition-colors hover:text-text"
                  >
                    {playing ? <IconPlayerPauseFilled size={14} /> : <IconPlayerPlayFilled size={14} />}
                    {playing ? journeyCopy.pause : journeyCopy.play}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Progress: a track through the four stage columns, draggable to scrub */}
          <div className="border-t border-line px-2 pb-4 pt-5 md:px-6 md:pb-6">
            <div className="relative grid grid-cols-4">
              <div
                ref={track}
                role="slider"
                tabIndex={0}
                aria-label={journeyCopy.progressLabel}
                aria-valuemin={1}
                aria-valuemax={STAGES.length}
                aria-valuenow={shown + 1}
                aria-valuetext={`${journeyCopy.stageOf(shown + 1, STAGES.length)}: ${stage.title}`}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                onKeyDown={onKeyDown}
                className="group absolute left-[12.5%] right-[12.5%] top-0 z-10 flex h-6 -translate-y-1/2 cursor-pointer touch-none items-center rounded-full focus-visible:outline-offset-4"
              >
                <div className="relative h-[3px] w-full rounded-full bg-line">
                  <motion.div className="absolute inset-y-0 left-0 rounded-full bg-molten" style={{ width: fill }} />
                  {STAGES.map((s, i) => (
                    <span
                      key={s.title}
                      aria-hidden
                      className={cn(
                        "absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border transition-colors duration-300",
                        i <= shown ? "border-molten bg-molten" : "border-line bg-surface",
                      )}
                      style={{ left: `${(i / LAST) * 100}%` }}
                    />
                  ))}
                  <motion.span
                    aria-hidden
                    className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-molten bg-bg shadow-[0_0_0_4px_color-mix(in_srgb,var(--color-molten)_18%,transparent)] transition-transform group-active:scale-125"
                    style={{ left: fill }}
                  />
                </div>
              </div>
              {STAGES.map((s, i) => (
                <button
                  key={s.title}
                  type="button"
                  onClick={() => goTo(i, true)}
                  aria-current={shown === i ? "step" : undefined}
                  className="group/stage relative flex flex-col items-center gap-2 px-1 pt-4 text-center"
                >
                  <span className={cn("font-machine text-[10px] md:text-xs", shown === i ? "text-molten" : "text-text-muted")}>0{i + 1}</span>
                  <span className={cn("text-xs leading-tight transition-colors md:text-sm", shown === i ? "text-text" : "text-text-muted group-hover/stage:text-text")}>{s.title}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function RoundButton({ label, onClick, disabled, accent, children }: { label: string; onClick: () => void; disabled?: boolean; accent?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "grid h-11 w-11 place-items-center rounded-full border transition-[transform,background-color,border-color,opacity] active:scale-95 disabled:pointer-events-none disabled:opacity-35",
        accent ? "border-molten bg-molten text-on-molten hover:bg-molten-hover" : "border-line text-text hover:border-pei/60",
      )}
    >
      {children}
    </button>
  );
}
