"use client";

import { useCallback, useSyncExternalStore } from "react";

function readFlag(key: string): boolean {
  try {
    return window.localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

/**
 * Tiny localStorage-backed boolean flag, used for demo-only interactive
 * state ("mark investigated") so a click survives a page refresh without
 * needing a real backend. Not synced across tabs/devices beyond the native
 * `storage` event.
 */
export function useLocalFlag(key: string): [boolean, (next: boolean) => void] {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const handler = (e: StorageEvent) => {
        if (e.key === key) onChange();
      };
      window.addEventListener("storage", handler);
      return () => window.removeEventListener("storage", handler);
    },
    [key]
  );

  const value = useSyncExternalStore(
    subscribe,
    () => readFlag(key),
    () => false
  );

  const set = useCallback(
    (next: boolean) => {
      try {
        window.localStorage.setItem(key, next ? "1" : "0");
      } catch {
        // localStorage unavailable (private browsing, etc.) — state just won't persist.
      }
      // storage event only fires in OTHER tabs; dispatch locally so this tab re-renders too.
      window.dispatchEvent(new StorageEvent("storage", { key }));
    },
    [key]
  );

  return [value, set];
}
