"use client";

import { useCallback, useEffect, useRef } from "react";

/**
 * Merges partial patches and persists them after `ms` of quiet; flushes on
 * unmount and when the page is hidden so edits are never dropped.
 */
export function useDebouncedSave<T extends object>(save: (patch: Partial<T>) => Promise<unknown>, ms = 500) {
  const pending = useRef<Partial<T> | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveRef = useRef(save);
  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  const flush = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    const patch = pending.current;
    pending.current = null;
    if (patch) void saveRef.current(patch);
  }, []);

  const schedule = useCallback(
    (patch: Partial<T>) => {
      pending.current = { ...pending.current, ...patch };
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(flush, ms);
    },
    [flush, ms],
  );

  useEffect(() => {
    const onHide = () => document.visibilityState === "hidden" && flush();
    document.addEventListener("visibilitychange", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      flush();
    };
  }, [flush]);

  return { schedule, flush };
}
