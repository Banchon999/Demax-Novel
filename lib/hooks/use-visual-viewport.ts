"use client";

import { useSyncExternalStore } from "react";

type Box = { height: number; offsetTop: number };

let cached: Box = { height: 0, offsetTop: 0 };

function read(): Box {
  const vv = window.visualViewport;
  const height = vv ? vv.height : window.innerHeight;
  const offsetTop = vv ? vv.offsetTop : 0;
  if (height !== cached.height || offsetTop !== cached.offsetTop) cached = { height, offsetTop };
  return cached;
}

function subscribe(cb: () => void) {
  const vv = window.visualViewport;
  vv?.addEventListener("resize", cb);
  vv?.addEventListener("scroll", cb);
  window.addEventListener("resize", cb);
  return () => {
    vv?.removeEventListener("resize", cb);
    vv?.removeEventListener("scroll", cb);
    window.removeEventListener("resize", cb);
  };
}

const server = (): Box => ({ height: 0, offsetTop: 0 });

/**
 * The visible area above the on-screen keyboard. Sizing the writing screen
 * to this keeps the toolbar/composer right on top of the keyboard on both
 * iOS (which overlays the keyboard) and Android.
 */
export function useVisualViewport(): Box {
  return useSyncExternalStore(subscribe, read, server);
}
