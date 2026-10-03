"use client";

import { createStore } from "./store";
import { prefersReducedMotion } from "./useReducedMotion";

/**
 * Shared state between the DOM tree and the single R3F canvas.
 * Plain module state, so it works across the tunnel into <View>.
 */

/* ---------- Frameloop ---------- */

const animating = new Set<string>();
/** Number of visible slots that currently need continuous frames. */
export const animatingCount = createStore(0);

/** A visible slot that is animating keeps the canvas on frameloop="always". */
export function setAnimating(key: string, on: boolean) {
  if (on) animating.add(key);
  else animating.delete(key);
  animatingCount.set(animating.size);
}

/* ---------- Modal ---------- */

/** While a modal holds a model slot, the canvas moves above it and page slots hide. */
export const modalOpen = createStore(false);

/* ---------- Pointer (for mouse parallax) ---------- */

/** Normalised pointer position, -1..1 on both axes, relative to the viewport centre. */
export const pointer = { x: 0, y: 0 };

/* ---------- Hero print timeline ---------- */

export const PRINT_DURATION_MS = 3500;

/** performance.now() when the hero print started. null = not started yet. */
export const heroPrintStart = createStore<number | null>(null);

/** Starts the one-time hero print. Later calls are ignored, so it never replays. */
export function startHeroPrint() {
  if (heroPrintStart.get() !== null) return;
  heroPrintStart.set(prefersReducedMotion() ? -Infinity : performance.now());
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/** 0..1 eased progress of the shared hero timeline (drives the headline). */
export function heroPrintProgress(now = performance.now()) {
  const start = heroPrintStart.get();
  if (start === null) return 0;
  const t = Math.min(1, Math.max(0, (now - start) / PRINT_DURATION_MS));
  return easeOutCubic(t);
}

/**
 * The model's own print clock. It starts when the model is actually on screen,
 * so a slow download never means the build finished before anyone saw it.
 * Like the headline, it plays once per page load.
 */
export const modelPrintStart = createStore<number | null>(null);

export function startModelPrint() {
  if (modelPrintStart.get() !== null) return;
  modelPrintStart.set(prefersReducedMotion() ? -Infinity : performance.now());
}

/** Gentle ease-out so layers keep stacking visibly right up to the top. */
const easeOutQuad = (t: number) => 1 - (1 - t) * (1 - t);

/** 0..1 eased model print progress. */
export function modelPrintProgress(now = performance.now()) {
  const start = modelPrintStart.get();
  if (start === null) return 0;
  const t = Math.min(1, Math.max(0, (now - start) / PRINT_DURATION_MS));
  return easeOutQuad(t);
}

/* ---------- Quote form pre-fill ---------- */

export interface QuotePrefill {
  category?: string;
  notes?: string;
  /** Changes on every request so the same value can be applied twice. */
  nonce: number;
}

export const quotePrefill = createStore<QuotePrefill | null>(null);

export function prefillQuote(prefill: Omit<QuotePrefill, "nonce">) {
  quotePrefill.set({ ...prefill, nonce: Date.now() });
}

/* ---------- Hero CTA visibility (keeps molten to two places per viewport) ---------- */

export const heroCtaVisible = createStore(false);

/* ---------- Dev inspection ---------- */

if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
  (window as unknown as { __voxel: unknown }).__voxel = { heroPrintStart, modelPrintStart, animatingCount, modalOpen };
}
