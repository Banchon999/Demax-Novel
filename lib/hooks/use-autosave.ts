"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AUTO_SNAPSHOT_INTERVAL, maybeAutoSnapshot, saveChapterContent } from "@/lib/db/repo";
import type { ChapterContent } from "@/lib/db/schema";

export type SaveState = "saved" | "pending" | "saving" | "error";

const DEBOUNCE_MS = 800;

/**
 * Debounced persistence for one chapter. Pending edits are flushed when the
 * page is hidden or the component unmounts, so switching apps on a phone
 * never loses the last sentence.
 */
export function useAutosave(chapterId: string) {
  const [state, setState] = useState<SaveState>("saved");
  const pending = useRef<ChapterContent | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(async () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    const content = pending.current;
    if (!content) return;
    pending.current = null;
    setState("saving");
    try {
      await saveChapterContent(chapterId, content);
      await maybeAutoSnapshot(chapterId, AUTO_SNAPSHOT_INTERVAL);
      setState(pending.current ? "pending" : "saved");
    } catch {
      pending.current ??= content;
      setState("error");
    }
  }, [chapterId]);

  const queue = useCallback(
    (content: ChapterContent) => {
      pending.current = content;
      setState("pending");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void flush(), DEBOUNCE_MS);
    },
    [flush],
  );

  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") void flush();
    };
    const onPageHide = () => void flush();
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onPageHide);
      void flush();
    };
  }, [flush]);

  return { state, queue, flush };
}

export const SAVE_LABELS: Record<SaveState, string> = {
  saved: "บันทึกแล้ว",
  pending: "กำลังพิมพ์…",
  saving: "กำลังบันทึก…",
  error: "บันทึกไม่สำเร็จ",
};
