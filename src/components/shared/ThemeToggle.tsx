"use client";

import { useEffect, useId, useRef, useState } from "react";
import { IconCheck, IconPalette } from "@tabler/icons-react";
import { appearanceStore, setAppearance } from "@/lib/theme";
import { ACCENTS, ACCENT_IDS, DEFAULT_ACCENT, DEFAULT_PALETTE, PALETTES, PALETTE_IDS, accentShade, type AccentId, type PaletteId } from "@/lib/themeConfig";
import { useStore } from "@/lib/store";
import { nav } from "@/content/site";
import { cn } from "@/lib/utils";

/**
 * Appearance picker: a background palette and an accent colour (which also
 * colours the 3D wireframes). Opens a small card under the button, or above it
 * with `placement="above"` (the admin sidebar).
 */
export function ThemeToggle({ className, placement = "below" }: { className?: string; placement?: "below" | "above" }) {
  const { palette, accent } = useStore(appearanceStore);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={nav.appearance}
        title={nav.appearance}
        aria-expanded={open}
        aria-controls={panelId}
        className={cn(
          "relative grid h-11 w-11 shrink-0 place-items-center rounded-full border border-line text-text-muted transition-[color,border-color,transform] duration-200 hover:border-pei/50 hover:text-text active:scale-[0.97]",
          open && "border-pei/60 text-text",
          className,
        )}
      >
        <IconPalette size={18} stroke={1.5} aria-hidden />
        {/* The current accent, as a small dot. */}
        <span aria-hidden className="absolute bottom-2 right-2 h-2 w-2 rounded-full bg-molten ring-2 ring-surface" />
      </button>

      {open && (
        <div
          id={panelId}
          role="dialog"
          aria-label={nav.appearance}
          data-cursor="native"
          className={cn(
            "z-[80] w-[min(340px,calc(100vw-1.5rem))] rounded-[20px] border border-line bg-surface p-4 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.6)]",
            // Phones: pinned under the header. Larger screens: next to the button.
            "fixed left-1/2 top-20 -translate-x-1/2 md:absolute md:left-auto md:translate-x-0",
            placement === "below" ? "md:right-0 md:top-full md:mt-3" : "md:bottom-full md:left-0 md:top-auto md:mb-3",
          )}
        >
          <div className="mb-3 flex items-center justify-between">
            <p className="font-heading text-base text-text">{nav.appearance}</p>
            {(palette !== DEFAULT_PALETTE || accent !== DEFAULT_ACCENT) && (
              <button
                type="button"
                onClick={() => setAppearance({ palette: DEFAULT_PALETTE, accent: DEFAULT_ACCENT })}
                className="text-xs text-text-muted underline underline-offset-4 hover:text-text"
              >
                {nav.appearanceReset}
              </button>
            )}
          </div>

          <fieldset>
            <legend className="mb-2 text-xs text-text-muted">{nav.appearanceBackground}</legend>
            <div role="radiogroup" className="grid grid-cols-3 gap-2">
              {PALETTE_IDS.map((id) => (
                <PaletteSwatch key={id} id={id} accent={accent} selected={palette === id} onSelect={() => setAppearance({ palette: id })} />
              ))}
            </div>
          </fieldset>

          <fieldset className="mt-4">
            <legend className="mb-1 text-xs text-text-muted">{nav.appearanceAccent}</legend>
            <p className="mb-2 text-[11px] text-text-muted/80">{nav.appearanceAccentHint}</p>
            <div role="radiogroup" className="flex flex-wrap gap-2">
              {ACCENT_IDS.map((id) => (
                <AccentSwatch key={id} id={id} palette={palette} selected={accent === id} onSelect={() => setAppearance({ accent: id })} />
              ))}
            </div>
          </fieldset>
        </div>
      )}
    </div>
  );
}

function PaletteSwatch({ id, accent, selected, onSelect }: { id: PaletteId; accent: AccentId; selected: boolean; onSelect: () => void }) {
  const p = PALETTES[id];
  const a = accentShade(id, accent).base;
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn("group flex flex-col gap-1.5 rounded-[14px] border p-1.5 text-left transition-colors", selected ? "border-molten" : "border-line hover:border-pei/60")}
    >
      {/* A tiny page: background, a card, a hairline and the accent. */}
      <span aria-hidden className="relative block h-12 overflow-hidden rounded-[9px]" style={{ background: p.bg }}>
        <span className="absolute inset-x-2 bottom-2 top-4 rounded-[5px] border" style={{ background: p.surface2, borderColor: p.line }} />
        <span className="absolute left-3.5 top-6 h-1 w-6 rounded-full" style={{ background: p.text, opacity: 0.85 }} />
        <span className="absolute left-3.5 top-8 h-1 w-4 rounded-full" style={{ background: p.muted }} />
        <span className="absolute bottom-3.5 right-3.5 h-2.5 w-2.5 rounded-full" style={{ background: a }} />
      </span>
      <span className="flex items-center justify-between px-0.5 text-[11px] text-text">
        {p.name}
        {selected && <IconCheck size={12} className="text-molten" aria-hidden />}
      </span>
    </button>
  );
}

function AccentSwatch({ id, palette, selected, onSelect }: { id: AccentId; palette: PaletteId; selected: boolean; onSelect: () => void }) {
  const shade = accentShade(palette, id);
  const name = ACCENTS[id].name;
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={name}
      title={name}
      onClick={onSelect}
      className={cn(
        "grid h-9 w-9 place-items-center rounded-full border-2 transition-transform active:scale-[0.94]",
        selected ? "border-text" : "border-transparent hover:scale-105",
      )}
      style={{ background: shade.base }}
    >
      {selected && <IconCheck size={14} style={{ color: shade.on }} aria-hidden />}
    </button>
  );
}
