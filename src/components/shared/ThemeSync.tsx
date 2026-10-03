"use client";

import { useEffect } from "react";
import { syncThemeFromDocument } from "@/lib/theme";

/** After hydration, adopts the theme the pre-paint script applied. */
export function ThemeSync() {
  useEffect(syncThemeFromDocument, []);
  return null;
}
