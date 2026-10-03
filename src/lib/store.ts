"use client";

import { useSyncExternalStore } from "react";

/** A tiny observable value, readable from both the DOM tree and the R3F tree. */
export function createStore<T>(initial: T) {
  let value = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => value,
    set(next: T | ((prev: T) => T)) {
      const resolved = typeof next === "function" ? (next as (prev: T) => T)(value) : next;
      if (Object.is(resolved, value)) return;
      value = resolved;
      listeners.forEach((l) => l());
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

export type Store<T> = ReturnType<typeof createStore<T>>;

/**
 * Subscribes to a store. Pass `serverValue` when the store may change before
 * hydration, so the first client render matches the server HTML.
 */
export function useStore<T>(store: Store<T>, ...serverValue: [T] | []) {
  const getServer = serverValue.length ? () => serverValue[0] as T : store.get;
  return useSyncExternalStore(store.subscribe, store.get, getServer);
}
