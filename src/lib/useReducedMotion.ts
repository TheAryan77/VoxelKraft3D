"use client";

import { useSyncExternalStore } from "react";

function subscribeTo(query: string) {
  return (onChange: () => void) => {
    const mql = window.matchMedia(query);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  };
}

/** Live `matchMedia` result. Returns `serverValue` during SSR and hydration. */
export function useMediaQuery(query: string, serverValue = false) {
  return useSyncExternalStore(
    subscribeTo(query),
    () => window.matchMedia(query).matches,
    () => serverValue,
  );
}

export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
export const MOBILE_QUERY = "(max-width: 767px)";

export function useReducedMotion() {
  return useMediaQuery(REDUCED_MOTION_QUERY);
}

export function useIsMobile() {
  return useMediaQuery(MOBILE_QUERY);
}

export function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia(REDUCED_MOTION_QUERY).matches;
}
