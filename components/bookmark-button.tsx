"use client";

import { useBookmarks } from "@/lib/library-store";
import { BookmarkIcon } from "./icons";

export function BookmarkButton({ novelId }: { novelId: string }) {
  const { ids, toggle } = useBookmarks();
  const saved = ids.includes(novelId);

  return (
    <button
      type="button"
      onClick={() => toggle(novelId)}
      aria-pressed={saved}
      className={`flex h-12 flex-1 items-center justify-center gap-2 rounded-xl text-sm font-semibold ring-1 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
        saved
          ? "bg-accent/15 text-accent-soft ring-accent/40"
          : "bg-surface text-fg ring-white/10 hover:bg-surface-2"
      }`}
    >
      <BookmarkIcon className={`size-5 ${saved ? "fill-current" : ""}`} />
      {saved ? "อยู่ในชั้นหนังสือ" : "เพิ่มเข้าชั้นหนังสือ"}
    </button>
  );
}
