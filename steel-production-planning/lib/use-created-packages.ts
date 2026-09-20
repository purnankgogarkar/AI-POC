"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { PackageInstance } from "@/lib/types";

const KEY = "p2-assemble:created-packages";
const CHANGE_EVENT = "p2-assemble:created-packages-changed";

const EMPTY: PackageInstance[] = [];
let cachedRaw: string | null = null;
let cachedValue: PackageInstance[] = EMPTY;

function read(): PackageInstance[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw !== cachedRaw) {
      cachedRaw = raw;
      cachedValue = raw ? (JSON.parse(raw) as PackageInstance[]) : EMPTY;
    }
    return cachedValue;
  } catch {
    return cachedValue;
  }
}

/** Packages generated through the "New Package" flow live only in this browser's localStorage. */
export function useCreatedPackages(): [PackageInstance[], (pkg: PackageInstance) => void] {
  const subscribe = useCallback((onChange: () => void) => {
    window.addEventListener(CHANGE_EVENT, onChange);
    return () => window.removeEventListener(CHANGE_EVENT, onChange);
  }, []);

  const packages = useSyncExternalStore(
    subscribe,
    () => read(),
    () => EMPTY
  );

  const addPackage = useCallback((pkg: PackageInstance) => {
    const current = read();
    try {
      window.localStorage.setItem(KEY, JSON.stringify([pkg, ...current]));
    } catch {
      // localStorage unavailable — the package just won't persist.
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  return [packages, addPackage];
}
