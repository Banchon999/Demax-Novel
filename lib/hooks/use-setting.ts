"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useCallback } from "react";
import { db } from "@/lib/db";
import { setSetting } from "@/lib/db/repo";

/** A value from the settings table, live across tabs. */
export function useSetting<T>(key: string, fallback: T): [T, (v: T) => void] {
  const row = useLiveQuery(() => db.settings.get(key), [key]);
  const value = row ? (row.value as T) : fallback;
  const set = useCallback((v: T) => void setSetting(key, v), [key]);
  return [value, set];
}

export const FONT_SIZES = { s: 16, m: 18, l: 20, xl: 23 } as const;
export type FontSizeKey = keyof typeof FONT_SIZES;
