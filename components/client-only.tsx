"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { Loading } from "./ui";

const noop = () => () => {};

/**
 * All app data lives in IndexedDB, so there is nothing to server-render;
 * prerender a loading shell and render the real view after hydration.
 */
export function ClientOnly({ children }: { children: ReactNode }) {
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  return mounted ? children : <Loading />;
}
