"use client";

import { createStore } from "./store";
import { THEME_COLORS, THEME_STORAGE_KEY, type Theme } from "./themeConfig";

export type { Theme };

/**
 * Current theme. Readable from the DOM tree and the R3F tree alike. Starts as
 * "dark" to match the server render; `syncThemeFromDocument` picks up what the
 * pre-paint script applied once React has hydrated.
 */
export const themeStore = createStore<Theme>("dark");

export function syncThemeFromDocument() {
  themeStore.set(document.documentElement.dataset.theme === "light" ? "light" : "dark");
}

export function setTheme(theme: Theme) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLORS[theme]);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Private mode: the choice just won't persist.
  }
  themeStore.set(theme);
}
