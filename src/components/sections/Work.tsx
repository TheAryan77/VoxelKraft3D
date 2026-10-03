"use client";

import { cursorProps } from "@/lib/cursor";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { IconX } from "@tabler/icons-react";
import { useLenis } from "lenis/react";
import { FocusCards } from "@/components/ui/focus-cards";
import { PhotoSlot } from "@/components/shared/PhotoSlot";
import { ModelSlot } from "@/components/three/ModelSlot";
import { work, type WorkItem } from "@/content/work";
import { cursorCopy, workCopy } from "@/content/site";
import { MODELS } from "@/lib/models.config";
import { modalOpen, prefillQuote } from "@/lib/sceneStore";
import { useOutsideClick } from "@/hooks/use-outside-click";
import { cn } from "@/lib/utils";
import { SectionHeading } from "./SectionHeading";

export function Work({ photos }: { photos: Record<string, boolean> }) {
  const [active, setActive] = useState<WorkItem | null>(null);
  const id = useId();
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const close = useCallback(() => setActive(null), []);

  useEffect(() => {
    modalOpen.set(active !== null);
    if (!active) {
      triggerRef.current?.focus({ preventScroll: true });
      return;
    }
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, close]);

  useEffect(() => () => modalOpen.set(false), []);

  return (
    <section id="work" aria-labelledby="work-heading" className="section-pad" {...cursorProps(cursorCopy.work)}>
      <div className="container-site">
        <SectionHeading id="work-heading" title={workCopy.heading} sub={workCopy.sub} />

        <FocusCards
          items={work}
          getKey={(item) => item.slug}
          renderCard={(item) => (
            <motion.button
              type="button"
              layoutId={`card-${item.slug}-${id}`}
              onClick={(e) => {
                triggerRef.current = e.currentTarget;
                setActive(item);
              }}
              className="group relative block w-full overflow-hidden rounded-[16px] border border-line bg-surface text-left transition-colors hover:border-pei/40 sm:rounded-[20px]"
              aria-haspopup="dialog"
            >
              <motion.div layoutId={`image-${item.slug}-${id}`}>
                <PhotoSlot
                  src={item.photo}
                  alt={item.title}
                  available={photos[item.photo]}
                  className="aspect-square w-full"
                />
              </motion.div>
              {item.tags?.length ? (
                <div className="absolute left-2 top-2 z-10 flex flex-wrap gap-1 sm:left-4 sm:top-4 sm:gap-1.5">
                  {item.tags.map((t) => (
                    <TagBadge key={t} label={t} />
                  ))}
                </div>
              ) : null}
              <div className="flex flex-col gap-1 p-3 sm:p-5">
                <motion.h3 layoutId={`title-${item.slug}-${id}`} className="font-heading text-sm leading-snug text-text sm:text-lg">
                  {item.title}
                </motion.h3>
                <p className="flex flex-wrap gap-x-3 gap-y-0.5 font-machine text-[11px] text-text-muted sm:gap-4 sm:text-sm">
                  <span>{item.material}</span>
                  <span>{item.printTime}</span>
                </p>
              </div>
            </motion.button>
          )}
        />
      </div>

      <AnimatePresence>
        {active && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-bg/85 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {active && (
          <WorkModal key={active.slug} item={active} id={id} photoAvailable={photos[active.photo]} onClose={close} />
        )}
      </AnimatePresence>
    </section>
  );
}

function WorkModal({
  item,
  id,
  photoAvailable,
  onClose,
}: {
  item: WorkItem;
  id: string;
  photoAvailable: boolean;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const lenis = useLenis();
  const hasModel = MODELS[item.modelId].src !== null;
  const titleId = `${id}-${item.slug}-title`;

  useOutsideClick(ref, onClose);
  useEffect(() => closeRef.current?.focus({ preventScroll: true }), []);

  // Keep keyboard focus inside the dialog.
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "Tab" || !ref.current) return;
    const focusable = ref.current.querySelectorAll<HTMLElement>("button, a[href]");
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const makeSimilar = (e: React.MouseEvent) => {
    e.preventDefault();
    prefillQuote({ category: item.category, notes: `Something like "${item.title}" (${item.material}, ${item.size}).` });
    onClose();
    window.setTimeout(() => {
      const target = document.getElementById("quote");
      if (!target) return;
      if (lenis) lenis.scrollTo(target, { offset: -80 });
      else target.scrollIntoView({ behavior: "smooth" });
    }, 60);
  };

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center p-0 md:p-8" role="presentation" data-cursor="">
      <motion.div
        ref={ref}
        layoutId={`card-${item.slug}-${id}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={onKeyDown}
        data-lenis-prevent
        className="relative grid h-full w-full max-w-5xl grid-cols-1 content-start overflow-y-auto bg-surface md:content-stretch md:h-auto md:max-h-[88vh] md:grid-cols-2 md:overflow-hidden md:rounded-[20px] md:border md:border-line"
      >
        <motion.div layoutId={`image-${item.slug}-${id}`} className="relative">
          {hasModel ? (
            <div {...cursorProps(cursorCopy.workModel)} className="relative aspect-[4/3] w-full bg-surface-2 md:h-full md:aspect-auto md:min-h-[520px]">
              <ModelSlot id={item.modelId} interactive layer="modal" className="absolute inset-0" />
              <p className="pointer-events-none absolute bottom-4 left-4 text-xs text-text-muted">{workCopy.orbitHint}</p>
            </div>
          ) : (
            <PhotoSlot
              src={item.photo}
              alt={item.title}
              available={photoAvailable}
              reveal={false}
              sizes="(min-width: 768px) 50vw, 100vw"
              className="aspect-[4/3] w-full md:aspect-auto md:h-full md:min-h-[520px]"
            />
          )}
        </motion.div>

        <div className="flex flex-col gap-5 p-5 md:gap-6 md:p-10">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col items-start gap-3">
              {item.tags?.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {item.tags.map((t) => (
                    <TagBadge key={t} label={t} />
                  ))}
                </div>
              ) : null}
              <motion.h3 id={titleId} layoutId={`title-${item.slug}-${id}`} className="font-heading text-2xl text-text md:text-3xl">
                {item.title}
              </motion.h3>
            </div>
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label={workCopy.close}
              className="absolute right-3 top-3 z-20 grid h-10 w-10 shrink-0 place-items-center rounded-full border border-line bg-bg/70 text-text backdrop-blur-sm transition hover:border-pei/50 hover:text-text active:scale-[0.97] md:static md:bg-transparent md:text-text-muted md:backdrop-blur-none"
            >
              <IconX size={18} />
            </button>
          </div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-6">
            <p className="prose-body text-text-muted">{item.description}</p>
            <dl className="grid grid-cols-3 gap-3 border-y border-line py-4 md:gap-4 md:py-5">
              {[
                [workCopy.materialLabel, item.material],
                [workCopy.sizeLabel, item.size],
                [workCopy.printTimeLabel, item.printTime],
              ].map(([label, value]) => (
                <div key={label} className="flex flex-col gap-1">
                  <dt className="text-xs text-text-muted">{label}</dt>
                  <dd className="font-machine text-sm text-text">{value}</dd>
                </div>
              ))}
            </dl>
            <a
              href="#quote"
              onClick={makeSimilar}
              className="inline-flex h-12 w-fit items-center justify-center rounded-full bg-molten px-7 text-sm font-semibold text-on-molten transition-[transform,background-color] duration-150 hover:bg-molten-hover active:scale-[0.97]"
            >
              {workCopy.cta}
            </a>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

/** Small pill on a work item, e.g. "Trending". */
function TagBadge({ label, className }: { label: string; className?: string }) {
  return (
    <span
      className={cn(
        "z-10 inline-flex items-center gap-1 rounded-full bg-molten px-2 py-0.5 text-[10px] font-semibold text-on-molten sm:gap-1.5 sm:px-3 sm:py-1 sm:text-xs",
        className,
      )}
    >
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-on-molten/70" />
      {label}
    </span>
  );
}
