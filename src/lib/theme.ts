"use client";

import { createStore } from "./store";
import {
  ACCENT_IDS,
  ACCENT_STORAGE_KEY,
  DEFAULT_ACCENT,
  DEFAULT_PALETTE,
  PALETTES,
  PALETTE_IDS,
  PALETTE_STORAGE_KEY,
  THEME_COLORS,
  type AccentId,
  type PaletteId,
  type Theme,
} from "./themeConfig";

export type { Theme, PaletteId, AccentId };

export interface Appearance {
  palette: PaletteId;
  accent: AccentId;
}

/**
 * Current palette and accent. Readable from the DOM tree and the R3F tree
 * alike. Starts at the defaults to match the server render;
 * `syncThemeFromDocument` picks up what the pre-paint script applied.
 */
export const appearanceStore = createStore<Appearance>({ palette: DEFAULT_PALETTE, accent: DEFAULT_ACCENT });

/** Light or dark, derived from the palette (for the few things that differ by scheme). */
export const themeStore = createStore<Theme>("dark");

export function syncThemeFromDocument() {
  const d = document.documentElement.dataset;
  const palette = PALETTE_IDS.includes(d.palette as PaletteId) ? (d.palette as PaletteId) : DEFAULT_PALETTE;
  const accent = ACCENT_IDS.includes(d.accent as AccentId) ? (d.accent as AccentId) : DEFAULT_ACCENT;
  const current = appearanceStore.get();
  if (current.palette !== palette || current.accent !== accent) appearanceStore.set({ palette, accent });
  themeStore.set(PALETTES[palette].scheme);
}

export function setAppearance(next: Partial<Appearance>) {
  const { palette, accent } = { ...appearanceStore.get(), ...next };
  const scheme = PALETTES[palette].scheme;
  const root = document.documentElement;
  root.dataset.palette = palette;
  root.dataset.accent = accent;
  root.dataset.theme = scheme;
  root.style.colorScheme = scheme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLORS[palette]);
  try {
    localStorage.setItem(PALETTE_STORAGE_KEY, palette);
    localStorage.setItem(ACCENT_STORAGE_KEY, accent);
  } catch {
    // Private mode: the choice just won't persist.
  }
  appearanceStore.set({ palette, accent });
  themeStore.set(scheme);
}

/** The accent's current hex value (for things that can't use CSS variables, e.g. Razorpay). */
export function currentAccentHex() {
  return getComputedStyle(document.documentElement).getPropertyValue("--color-molten").trim() || "#ff6a13";
}
