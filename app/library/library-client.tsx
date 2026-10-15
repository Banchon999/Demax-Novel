"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { BookmarkIcon } from "@/components/icons";
import { NovelCard } from "@/components/novel-card";
import { NovelCover } from "@/components/novel-cover";
import { useBookmarks } from "@/lib/library-store";
import { getNovel, type Novel } from "@/lib/novels";

/** Mock reading history until accounts exist. */
const HISTORY: { id: string; chapter: number; lastRead: string }[] = [
  { id: "last-sss-player", chapter: 452, lastRead: "เมื่อ 2 ชั่วโมงที่แล้ว" },
  { id: "villainess-princess", chapter: 187, lastRead: "เมื่อวาน" },
  { id: "bangkok-exorcist", chapter: 64, lastRead: "3 วันที่แล้ว" },
  { id: "village-alchemist", chapter: 12, lastRead: "สัปดาห์ที่แล้ว" },
];

const TABS = [
  { id: "history", label: "กำลังอ่าน" },
  { id: "saved", label: "ติดตาม" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function LibraryClient() {
  const [tab, setTab] = useState<TabId>("history");
  const { ids } = useBookmarks();
  const baseId = useId();

  const saved = ids.map(getNovel).filter((n): n is Novel => n !== undefined);

  return (
    <>
      <div
        role="tablist"
        aria-label="ชั้นหนังสือ"
        className="mx-4 grid grid-cols-2 gap-1 rounded-xl bg-surface p-1"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            id={`${baseId}-tab-${t.id}`}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            aria-controls={`${baseId}-panel-${t.id}`}
            tabIndex={tab === t.id ? 0 : -1}
            onClick={() => setTab(t.id)}
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
                const next = tab === "history" ? "saved" : "history";
                setTab(next);
                document.getElementById(`${baseId}-tab-${next}`)?.focus();
              }
            }}
            className={`rounded-lg py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-accent ${
              tab === t.id ? "bg-surface-2 text-fg shadow" : "text-muted hover:text-fg"
            }`}
          >
            {t.label}
            {t.id === "saved" && saved.length > 0 && (
              <span className="ml-1.5 rounded-full bg-accent px-1.5 text-[0.65rem] text-white">
                {saved.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {TABS.map((t) => (
        <div
          key={t.id}
          role="tabpanel"
          id={`${baseId}-panel-${t.id}`}
          aria-labelledby={`${baseId}-tab-${t.id}`}
          hidden={tab !== t.id}
          className="mt-4 px-4"
        >
          {t.id === "history" ? <History /> : <Saved novels={saved} />}
        </div>
      ))}
    </>
  );
}

function History() {
  return (
    <ul className="space-y-2.5">
      {HISTORY.map(({ id, chapter, lastRead }) => {
        const novel = getNovel(id);
        if (!novel) return null;
        const progress = Math.round((chapter / novel.chapters) * 100);
        return (
          <li key={id}>
            <Link
              href={`/novel/${id}`}
              className="flex gap-3 rounded-2xl bg-surface p-2.5 ring-1 ring-white/5 hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-accent"
            >
              <NovelCover novel={novel} showTitle={false} className="w-14 shrink-0 rounded-lg" />
              <div className="flex min-w-0 flex-1 flex-col justify-center">
                <h3 className="truncate font-semibold">{novel.title}</h3>
                <p className="mt-0.5 text-xs text-muted">
                  อ่านถึงตอนที่ {chapter} จาก {novel.chapters} · {lastRead}
                </p>
                <div
                  role="progressbar"
                  aria-label={`ความคืบหน้าการอ่าน ${novel.title}`}
                  aria-valuenow={progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10"
                >
                  <div className="h-full rounded-full bg-accent" style={{ width: `${progress}%` }} />
                </div>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function Saved({ novels }: { novels: Novel[] }) {
  if (novels.length === 0) {
    return (
      <div className="rounded-2xl bg-surface px-6 py-12 text-center ring-1 ring-white/5">
        <BookmarkIcon className="mx-auto size-10 text-muted" />
        <p className="mt-3 font-semibold">ยังไม่มีนิยายที่ติดตาม</p>
        <p className="mt-1 text-sm text-muted">
          กด “เพิ่มเข้าชั้นหนังสือ” ในหน้านิยายเพื่อบันทึกเรื่องที่ชอบ
        </p>
        <Link
          href="/search"
          className="mt-4 inline-block rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white hover:bg-accent/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          ค้นหานิยาย
        </Link>
      </div>
    );
  }
  return (
    <ul className="grid grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-4">
      {novels.map((n) => (
        <li key={n.id}>
          <NovelCard novel={n} />
        </li>
      ))}
    </ul>
  );
}
