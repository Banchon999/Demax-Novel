"use client";

import { useEffect } from "react";

/**
 * Registers the offline service worker (production only — it would cache
 * stale dev bundles) and asks the browser not to evict IndexedDB.
 */
export function PwaSetup() {
  useEffect(() => {
    void navigator.storage?.persist?.().catch(() => {});
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {});
  }, []);
  return null;
}
