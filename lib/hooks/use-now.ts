"use client";

import { useSyncExternalStore } from "react";

let now = Date.now();

function subscribe(cb: () => void) {
  const tick = () => {
    now = Date.now();
    cb();
  };
  const id = setInterval(tick, 60_000);
  const onVisible = () => document.visibilityState === "visible" && tick();
  document.addEventListener("visibilitychange", onVisible);
  return () => {
    clearInterval(id);
    document.removeEventListener("visibilitychange", onVisible);
  };
}

/** Current time, refreshed each minute and when the app comes back to view. */
export function useNow(): number {
  return useSyncExternalStore(subscribe, () => now, () => now);
}
