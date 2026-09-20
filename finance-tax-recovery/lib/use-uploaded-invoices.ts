"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { Invoice } from "@/lib/types";

const KEY = "p2-verify:uploaded-invoices";
const CHANGE_EVENT = "p2-verify:uploaded-invoices-changed";

// useSyncExternalStore requires getSnapshot to return a stable reference
// when nothing changed — cache the parsed result keyed on the raw string so
// repeated reads between change events don't produce a new array each time
// (which would otherwise trigger a render loop).
const EMPTY: Invoice[] = [];
let cachedRaw: string | null = null;
let cachedValue: Invoice[] = EMPTY;

function read(): Invoice[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw !== cachedRaw) {
      cachedRaw = raw;
      cachedValue = raw ? (JSON.parse(raw) as Invoice[]) : [];
    }
    return cachedValue;
  } catch {
    return cachedValue;
  }
}

/**
 * Invoices "uploaded" through the simulated upload flow live only in this
 * browser's localStorage — there's no backend. This lets a demo add an
 * invoice and have it persist across a refresh without a real database.
 */
export function useUploadedInvoices(): [Invoice[], (invoice: Invoice) => void] {
  const subscribe = useCallback((onChange: () => void) => {
    window.addEventListener(CHANGE_EVENT, onChange);
    return () => window.removeEventListener(CHANGE_EVENT, onChange);
  }, []);

  const invoices = useSyncExternalStore(
    subscribe,
    () => read(),
    () => EMPTY
  );

  const addInvoice = useCallback((invoice: Invoice) => {
    const current = read();
    try {
      window.localStorage.setItem(KEY, JSON.stringify([invoice, ...current]));
    } catch {
      // localStorage unavailable — the invoice just won't persist.
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  return [invoices, addInvoice];
}
