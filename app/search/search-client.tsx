"use client";

import { useSearchParams } from "next/navigation";
import {
  useDeferredValue,
  useEffect,
  useId,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { CloseIcon, SearchIcon } from "@/components/icons";
import { NovelRow } from "@/components/novel-card";
import {
  GENRES,
  NOVELS,
  STATUS_LABELS,
  genreLabel,
  isGenreId,
  trendScore,
  type GenreId,
  type Novel,
  type NovelStatus,
} from "@/lib/novels";

const SORTS = {
  views: { label: "ยอดอ่าน", compare: (a: Novel, b: Novel) => b.views - a.views },
  trending: {
    label: "มาแรง",
    compare: (a: Novel, b: Novel) => trendScore(b) - trendScore(a),
  },
  rating: { label: "คะแนน", compare: (a: Novel, b: Novel) => b.rating - a.rating },
  updated: {
    label: "อัปเดตล่าสุด",
    compare: (a: Novel, b: Novel) => b.updatedAt.localeCompare(a.updatedAt),
  },
} as const;

type SortId = keyof typeof SORTS;
type StatusFilter = NovelStatus | "all";

function isSortId(value: string | null): value is SortId {
  return value !== null && value in SORTS;
}

function isStatus(value: string | null): value is NovelStatus {
  return value === "ongoing" || value === "completed";
}

function normalize(s: string): string {
  return s.toLocaleLowerCase("th").replace(/\s+/g, " ").trim();
}

function matches(novel: Novel, q: string): boolean {
  if (!q) return true;
  const haystack = normalize(
    [novel.title, novel.author, ...novel.tags, ...novel.genres.map(genreLabel)].join(" "),
  );
  // Every word must appear somewhere, so "ระบบ ตลก" narrows rather than widens.
  return q.split(" ").every((word) => haystack.includes(word));
}

export function SearchClient() {
  const params = useSearchParams();
  const [query, setQuery] = useState(() => params.get("q") ?? "");
  const [genre, setGenre] = useState<GenreId | null>(() => {
    const g = params.get("genre");
    return isGenreId(g) ? g : null;
  });
  const [status, setStatus] = useState<StatusFilter>(() => {
    const s = params.get("status");
    return isStatus(s) ? s : "all";
  });
  const [sort, setSort] = useState<SortId>(() => {
    const s = params.get("sort");
    return isSortId(s) ? s : "views";
  });

  const deferredQuery = useDeferredValue(query);
  const ids = { input: useId(), sort: useId(), results: useId() };

  // Mirror filters into the URL so results are shareable, without a server round-trip.
  useEffect(() => {
    const next = new URLSearchParams();
    if (query.trim()) next.set("q", query.trim());
    if (genre) next.set("genre", genre);
    if (status !== "all") next.set("status", status);
    if (sort !== "views") next.set("sort", sort);
    const search = next.size > 0 ? `?${next}` : "";
    if (search !== window.location.search) {
      window.history.replaceState(null, "", `${window.location.pathname}${search}`);
    }
  }, [query, genre, status, sort]);

  const results = useMemo(() => {
    const q = normalize(deferredQuery);
    return NOVELS.filter(
      (n) =>
        matches(n, q) &&
        (genre === null || n.genres.includes(genre)) &&
        (status === "all" || n.status === status),
    ).sort(SORTS[sort].compare);
  }, [deferredQuery, genre, status, sort]);

  const hasFilters = query !== "" || genre !== null || status !== "all";

  return (
    <div className="space-y-4">
      <form role="search" onSubmit={(e) => e.preventDefault()} className="px-4">
        <label htmlFor={ids.input} className="sr-only">
          ค้นหาชื่อนิยาย ผู้แต่ง หรือแท็ก
        </label>
        <div className="flex items-center gap-2 rounded-2xl bg-surface px-3 ring-1 ring-white/10 focus-within:ring-2 focus-within:ring-accent">
          <SearchIcon className="size-5 shrink-0 text-muted" />
          <input
            id={ids.input}
            type="search"
            inputMode="search"
            enterKeyHint="search"
            autoComplete="off"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ชื่อนิยาย ผู้แต่ง หรือแท็ก…"
            aria-controls={ids.results}
            className="h-12 min-w-0 flex-1 bg-transparent text-base text-fg placeholder:text-muted focus:outline-none [&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="ล้างคำค้นหา"
              className="grid size-8 place-items-center rounded-full text-muted hover:bg-white/10 hover:text-fg focus-visible:outline-2 focus-visible:outline-accent"
            >
              <CloseIcon className="size-4" />
            </button>
          )}
        </div>
      </form>

      <div role="group" aria-label="กรองตามหมวดหมู่">
        <ul className="scroller flex gap-2 overflow-x-auto px-4 pb-1">
          <li>
            <Chip pressed={genre === null} onClick={() => setGenre(null)}>
              ทั้งหมด
            </Chip>
          </li>
          {GENRES.map((g) => (
            <li key={g.id}>
              <Chip
                pressed={genre === g.id}
                onClick={() => setGenre(genre === g.id ? null : g.id)}
              >
                {g.label}
              </Chip>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 px-4">
        <div role="group" aria-label="สถานะ" className="flex gap-1 rounded-xl bg-surface p-1">
          {(["all", "ongoing", "completed"] as const).map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={status === s}
              onClick={() => setStatus(s)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-accent ${
                status === s ? "bg-surface-2 text-fg shadow" : "text-muted hover:text-fg"
              }`}
            >
              {s === "all" ? "ทั้งหมด" : STATUS_LABELS[s]}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor={ids.sort} className="text-xs text-muted">
            เรียงตาม
          </label>
          <select
            id={ids.sort}
            value={sort}
            onChange={(e) => setSort(e.target.value as SortId)}
            className="h-9 rounded-lg bg-surface px-2 text-sm text-fg ring-1 ring-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {Object.entries(SORTS).map(([id, { label }]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <section id={ids.results} aria-label="ผลการค้นหา" className="px-4">
        <p aria-live="polite" className="mb-3 text-sm text-muted">
          พบ {results.length} เรื่อง
          {genre && ` ในหมวด${genreLabel(genre)}`}
        </p>
        {results.length > 0 ? (
          <ul className="grid gap-2.5 sm:grid-cols-2">
            {results.map((novel) => (
              <li key={novel.id}>
                <NovelRow novel={novel} showGrowth={sort === "trending"} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-2xl bg-surface px-6 py-12 text-center ring-1 ring-white/5">
            <p className="font-semibold">ไม่พบนิยายที่ตรงกับการค้นหา</p>
            <p className="mt-1 text-sm text-muted">ลองใช้คำค้นอื่น หรือเลือกหมวดหมู่ใหม่</p>
            {hasFilters && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setGenre(null);
                  setStatus("all");
                }}
                className="mt-4 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white hover:bg-accent/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                ล้างตัวกรองทั้งหมด
              </button>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function Chip({
  pressed,
  onClick,
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium ring-1 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
        pressed
          ? "bg-accent text-white ring-accent"
          : "bg-surface text-fg/85 ring-white/10 hover:bg-surface-2"
      }`}
    >
      {children}
    </button>
  );
}

export function SearchFallback() {
  return (
    <div className="space-y-4 px-4" aria-hidden="true">
      <div className="h-12 animate-pulse rounded-2xl bg-surface" />
      <div className="flex gap-2">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-9 w-20 animate-pulse rounded-full bg-surface" />
        ))}
      </div>
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="h-28 animate-pulse rounded-2xl bg-surface" />
      ))}
    </div>
  );
}
