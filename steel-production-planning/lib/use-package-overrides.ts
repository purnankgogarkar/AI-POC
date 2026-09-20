"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { PackageEvent, PackageInstance } from "@/lib/types";

interface FieldOverride {
  status: "Populated";
  source: "Human";
  value: string;
  note: string;
}

interface OverrideState {
  fieldOverrides: Record<string, FieldOverride>;
  approved: boolean;
  releasedAt: string | null;
  extraHistory: PackageEvent[];
}

const EMPTY: OverrideState = { fieldOverrides: {}, approved: false, releasedAt: null, extraHistory: [] };

function keyFor(packageId: string) {
  return `p2-assemble:overrides:${packageId}`;
}

const cache = new Map<string, { raw: string | null; value: OverrideState }>();

function read(packageId: string): OverrideState {
  const k = keyFor(packageId);
  try {
    const raw = window.localStorage.getItem(k);
    const hit = cache.get(k);
    if (hit && hit.raw === raw) return hit.value;
    const value: OverrideState = raw ? (JSON.parse(raw) as OverrideState) : EMPTY;
    cache.set(k, { raw, value });
    return value;
  } catch {
    return EMPTY;
  }
}

function write(packageId: string, state: OverrideState) {
  try {
    window.localStorage.setItem(keyFor(packageId), JSON.stringify(state));
  } catch {
    // localStorage unavailable — changes just won't persist across reloads.
  }
  window.dispatchEvent(new Event(`p2-assemble:overrides-changed:${packageId}`));
}

/** Applies this browser's local overrides on top of the seeded package data. */
export function applyOverrides(pkg: PackageInstance, overrides: OverrideState): PackageInstance {
  const requirements = pkg.requirements.map((r) => {
    const o = overrides.fieldOverrides[r.id];
    return o ? { ...r, status: o.status, source: o.source, value: o.value, note: o.note, conflictValues: undefined } : r;
  });

  const openExceptions = requirements.filter((r) => r.status !== "Populated").length;
  const status = overrides.releasedAt
    ? ("Released" as const)
    : overrides.approved
      ? ("Approved" as const)
      : pkg.status === "Released" || pkg.status === "Approved"
        ? pkg.status
        : openExceptions > 0
          ? ("Needs Review" as const)
          : ("Draft Generated" as const);

  return {
    ...pkg,
    requirements,
    status,
    releasedAt: overrides.releasedAt ?? pkg.releasedAt,
    correctionsCount: pkg.correctionsCount + Object.keys(overrides.fieldOverrides).length,
    history: [...pkg.history, ...overrides.extraHistory],
  };
}

export function usePackageOverrides(packageId: string) {
  const eventName = `p2-assemble:overrides-changed:${packageId}`;

  const subscribe = useCallback(
    (onChange: () => void) => {
      window.addEventListener(eventName, onChange);
      return () => window.removeEventListener(eventName, onChange);
    },
    [eventName]
  );

  const overrides = useSyncExternalStore(
    subscribe,
    () => read(packageId),
    () => EMPTY
  );

  const resolveField = useCallback(
    (fieldId: string, actor: string, note: string) => {
      const current = read(packageId);
      write(packageId, {
        ...current,
        fieldOverrides: {
          ...current.fieldOverrides,
          [fieldId]: { status: "Populated", source: "Human", value: "Corrected by planner", note },
        },
        extraHistory: [
          ...current.extraHistory,
          { timestamp: new Date().toISOString().slice(0, 10), event: `Exception resolved: ${note}`, actor },
        ],
      });
    },
    [packageId]
  );

  const approveAndRelease = useCallback(
    (actor: string, release: boolean) => {
      const current = read(packageId);
      const today = new Date().toISOString().slice(0, 10);
      write(packageId, {
        ...current,
        approved: true,
        releasedAt: release ? today : current.releasedAt,
        extraHistory: [
          ...current.extraHistory,
          { timestamp: today, event: "Package approved", actor },
          ...(release ? [{ timestamp: today, event: "Package released to shop", actor }] : []),
        ],
      });
    },
    [packageId]
  );

  return { overrides, resolveField, approveAndRelease };
}
