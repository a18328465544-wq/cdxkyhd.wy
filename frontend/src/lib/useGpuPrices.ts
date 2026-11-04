import { useEffect, useSyncExternalStore } from "react";
import type { GpuPrice } from "../types";
import { apiFetch } from "./api";
import { startVisiblePolling } from "./visiblePolling";

const listeners = new Set<() => void>();
let snapshot: { prices: GpuPrice[]; status: "loading" | "ready" | "error"; readAt: number | null } = { prices: [], status: "loading", readAt: null };
let users = 0;
let stop: (() => void) | undefined;
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
const getSnapshot = () => snapshot;

function pollPrices() {
  return startVisiblePolling(async signal => {
    if (!snapshot.readAt || Date.now() - snapshot.readAt >= 60_000) {
      snapshot = { ...snapshot, prices: [], status: "loading" };
      listeners.forEach(listener => listener());
    }
    try {
      const data = await apiFetch<{ success: boolean; prices: GpuPrice[] }>("/api/prices", { signal });
      if (signal.aborted) return;
      if (!data.success || !Array.isArray(data.prices)) throw new Error("Invalid prices");
      snapshot = { prices: data.prices, status: "ready", readAt: Date.now() };
    } catch {
      if (signal.aborted) return;
      snapshot = { ...snapshot, prices: [], status: "error" };
    }
    listeners.forEach(listener => listener());
  }, 60_000);
}

function retry() {
  if (!users) return;
  stop?.();
  snapshot = { ...snapshot, prices: [], status: "loading" };
  listeners.forEach(listener => listener());
  stop = pollPrices();
}

/** Hero and price table share one active read, but never retain a settled promise forever. */
export function useGpuPrices() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  useEffect(() => {
    if (users++ === 0) {
      stop = pollPrices();
    }
    return () => { if (--users === 0) { stop?.(); stop = undefined; } };
  }, []);
  return { ...state, retry };
}
