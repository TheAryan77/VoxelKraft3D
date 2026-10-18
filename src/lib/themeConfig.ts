/**
 * Appearance: a background palette plus an accent colour (which also colours
 * the 3D wireframes). Safe to import from server components.
 *
 * This file is the single source of truth: the CSS for every palette and
 * accent is generated from it (see appearanceCss), and the 3D scenes read the
 * same values (see sceneColors).
 */

export type Scheme = "dark" | "light";
/** Kept for older call sites: the light/dark scheme of the current palette. */
export type Theme = Scheme;

export type PaletteId = "soot" | "midnight" | "forest" | "plum" | "paper" | "sand";
export type AccentId = "molten" | "cyan" | "lime" | "pink" | "violet" | "gold";

export interface Palette {
  name: string;
  scheme: Scheme;
  bg: string;
  surface: string;
  surface2: string;
  line: string;
  text: string;
  muted: string;
  /** Secondary accent: hover borders, material bars, bento glow. */
  pei: string;
  glow: [string, string, string];
  error: string;
}

export const PALETTES: Record<PaletteId, Palette> = {
  soot: {
    name: "Soot",
    scheme: "dark",
    bg: "#050505",
    surface: "#0e0d0c",
    surface2: "#171513",
    line: "#2a2622",
    text: "#f2eee8",
    muted: "#9c948a",
    pei: "#b8925a",
    glow: ["#b8925a", "#d8b98a", "#8a6a3e"],
    error: "#ff9a5c",
  },
  midnight: {
    name: "Midnight",
    scheme: "dark",
    bg: "#05080f",
    surface: "#0b111c",
    surface2: "#121a29",
    line: "#202c42",
    text: "#e9eef7",
    muted: "#8d9ab0",
    pei: "#7f9cc9",
    glow: ["#7f9cc9", "#aec3e3", "#4f6c99"],
    error: "#ff8f8f",
  },
  forest: {
    name: "Forest",
    scheme: "dark",
    bg: "#040906",
    surface: "#0a130e",
    surface2: "#111e17",
    line: "#1d3227",
    text: "#e7f0ea",
    muted: "#8ea699",
    pei: "#8db59a",
    glow: ["#8db59a", "#b9d6c1", "#5c8a6b"],
    error: "#ff9a7a",
  },
  plum: {
    name: "Plum",
    scheme: "dark",
    bg: "#0a060d",
    surface: "#140c19",
    surface2: "#1d1324",
    line: "#33223f",
    text: "#f2eaf6",
    muted: "#a596ae",
    pei: "#b994cb",
    glow: ["#b994cb", "#d8bfe4", "#86619a"],
    error: "#ff9aa8",
  },
  paper: {
    name: "Paper",
    scheme: "light",
    bg: "#ffffff",
    surface: "#fff8f3",
    surface2: "#fdefe4",
    line: "#f3dccb",
    text: "#1c1410",
    muted: "#6e6057",
    pei: "#f0843f",
    glow: ["#ff6a13", "#ffb27a", "#f0843f"],
    error: "#c2410c",
  },
  sand: {
    name: "Sand",
    scheme: "light",
    bg: "#f3ecdf",
    surface: "#ebe2d2",
    surface2: "#e2d6c1",
    line: "#d0c0a6",
    text: "#2a2117",
    muted: "#6e6250",
    pei: "#9c763f",
    glow: ["#9c763f", "#c9a36a", "#6f5228"],
    error: "#b4370f",
  },
};

interface AccentShade {
  /** Buttons, highlights, wireframe lines. */
  base: string;
  hover: string;
  /** Text on top of the accent. */
  on: string;
}

/** Each accent has a bright shade for dark palettes and a deeper one for light ones. */
export const ACCENTS: Record<AccentId, { name: string; dark: AccentShade; light: AccentShade }> = {
  molten: { name: "Molten", dark: { base: "#ff6a13", hover: "#ff7d33", on: "#050505" }, light: { base: "#ff6a13", hover: "#f25d0a", on: "#050505" } },
  cyan: { name: "Cyan", dark: { base: "#22d3ee", hover: "#5ee0f3", on: "#04151a" }, light: { base: "#0891b2", hover: "#0e7490", on: "#ffffff" } },
  lime: { name: "Lime", dark: { base: "#a3e635", hover: "#b8ef62", on: "#0d1503" }, light: { base: "#4d7c0f", hover: "#3f6212", on: "#ffffff" } },
  pink: { name: "Pink", dark: { base: "#f472b6", hover: "#f799c9", on: "#1a0610" }, light: { base: "#db2777", hover: "#be185d", on: "#ffffff" } },
  violet: { name: "Violet", dark: { base: "#a78bfa", hover: "#c0aefc", on: "#0f0a1f" }, light: { base: "#7c3aed", hover: "#6d28d9", on: "#ffffff" } },
  gold: { name: "Gold", dark: { base: "#f5b83d", hover: "#f8c966", on: "#170f02" }, light: { base: "#b45309", hover: "#92400e", on: "#ffffff" } },
};

export const DEFAULT_PALETTE: PaletteId = "soot";
export const DEFAULT_ACCENT: AccentId = "molten";
export const PALETTE_IDS = Object.keys(PALETTES) as PaletteId[];
export const ACCENT_IDS = Object.keys(ACCENTS) as AccentId[];

export const PALETTE_STORAGE_KEY = "vk-palette";
export const ACCENT_STORAGE_KEY = "vk-accent";
/** The old light/dark toggle's key, migrated on first load. */
export const LEGACY_THEME_KEY = "vk-theme";

/** Browser UI colour (address bar on phones), per palette. */
export const THEME_COLORS = Object.fromEntries(PALETTE_IDS.map((id) => [id, PALETTES[id].bg])) as Record<PaletteId, string>;

export function accentShade(palette: PaletteId, accent: AccentId) {
  return ACCENTS[accent][PALETTES[palette].scheme];
}

/* --------------------------------- Colour --------------------------------- */

function hexToRgb(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Mix two hex colours; t = 0 gives a, t = 1 gives b. */
export function mixHex(a: string, b: string, t: number) {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  const c = (x: number, y: number) => Math.round(x + (y - x) * t).toString(16).padStart(2, "0");
  return `#${c(r1, r2)}${c(g1, g2)}${c(b1, b2)}`;
}

/** Colours for the 3D wireframes: body in the palette, lines in the accent. */
export function sceneColors(palette: PaletteId, accent: AccentId) {
  const p = PALETTES[palette];
  const a = accentShade(palette, accent).base;
  const light = p.scheme === "light";
  return {
    accent: a,
    /** Body of wireframe models. */
    solid: light ? mixHex(p.surface2, "#ffffff", 0.5) : p.surface2,
    /** Triangle edges on real models. */
    wire: mixHex(p.surface2, a, light ? 0.78 : 0.72),
    /** Quieter edges on placeholder models. */
    placeholderLine: mixHex(p.surface2, a, light ? 0.45 : 0.2),
  };
}

/* ---------------------------------- CSS ----------------------------------- */

/** CSS for every palette and accent, inlined in <head> by the root layout. */
export function appearanceCss() {
  const palettes = PALETTE_IDS.map((id) => {
    const p = PALETTES[id];
    return `html[data-palette="${id}"]{--color-bg:${p.bg};--color-surface:${p.surface};--color-surface-2:${p.surface2};--color-line:${p.line};--color-text:${p.text};--color-text-muted:${p.muted};--color-pei:${p.pei};--color-error:${p.error};--glow-1:${p.glow[0]};--glow-2:${p.glow[1]};--glow-3:${p.glow[2]};color-scheme:${p.scheme}}`;
  });
  const accents = ACCENT_IDS.flatMap((id) =>
    (["dark", "light"] as Scheme[]).map((scheme) => {
      const s = ACCENTS[id][scheme];
      return `html[data-accent="${id}"][data-theme="${scheme}"]{--color-molten:${s.base};--color-molten-hover:${s.hover};--color-molten-soft:${s.base}${scheme === "dark" ? "33" : "40"};--color-on-molten:${s.on}}`;
    }),
  );
  return [...palettes, ...accents].join("\n");
}

/**
 * Runs in <head> before first paint, so a returning visitor never sees the
 * wrong colours flash. Soot + Molten is the default.
 */
export const themeInitScript = `(function(){try{
var P=${JSON.stringify(Object.fromEntries(PALETTE_IDS.map((id) => [id, [PALETTES[id].scheme, PALETTES[id].bg]])))};
var A=${JSON.stringify(ACCENT_IDS)};
var s=localStorage,p=s.getItem("${PALETTE_STORAGE_KEY}"),a=s.getItem("${ACCENT_STORAGE_KEY}");
if(!P[p]){var old=s.getItem("${LEGACY_THEME_KEY}");p=old==="light"?"paper":"${DEFAULT_PALETTE}";}
if(A.indexOf(a)<0)a="${DEFAULT_ACCENT}";
var d=document.documentElement;d.dataset.palette=p;d.dataset.accent=a;d.dataset.theme=P[p][0];d.style.colorScheme=P[p][0];
var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute("content",P[p][1]);
}catch(e){}})();`;
