import Link from "next/link";
import { formatCount, genreLabel, type Novel } from "@/lib/novels";
import { NovelCover } from "./novel-cover";
import { EyeIcon, StarIcon, TrendingIcon } from "./icons";

/** Vertical poster card used in carousels and grids. */
export function NovelCard({ novel, rank }: { novel: Novel; rank?: number }) {
  return (
    <Link
      href={`/novel/${novel.id}`}
      className="group block rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
    >
      <div className="relative">
        <NovelCover
          novel={novel}
          className="transition-transform duration-200 group-hover:-translate-y-0.5 group-active:scale-[0.98]"
        />
        {rank !== undefined && (
          <span
            className={`absolute left-1.5 top-1.5 grid min-w-7 place-items-center rounded-lg px-1.5 py-0.5 text-xs font-extrabold shadow-lg ${
              rank <= 3 ? "bg-accent text-white" : "bg-black/70 text-white/90"
            }`}
          >
            <span className="sr-only">อันดับ </span>
            {rank}
          </span>
        )}
        <span className="absolute right-1.5 top-1.5 flex items-center gap-0.5 rounded-md bg-black/60 px-1.5 py-0.5 text-[0.65rem] font-semibold text-amber-300 backdrop-blur-sm">
          <StarIcon className="size-3 fill-current" />
          <span className="sr-only">คะแนน </span>
          {novel.rating.toFixed(1)}
        </span>
      </div>
      <h3 className="mt-2 line-clamp-2 text-sm font-semibold leading-snug text-fg group-hover:text-accent-soft">
        {novel.title}
      </h3>
      <p className="mt-0.5 truncate text-xs text-muted">
        {novel.genres.map(genreLabel).join(" · ")}
      </p>
      <p className="mt-1 flex items-center gap-1 text-xs text-muted">
        <EyeIcon className="size-3.5" />
        {formatCount(novel.views)}
        <span className="sr-only"> ครั้งที่อ่าน</span>
      </p>
    </Link>
  );
}

/** Horizontal list row with weekly growth, used for trending lists and search results. */
export function NovelRow({
  novel,
  rank,
  showGrowth = false,
}: {
  novel: Novel;
  rank?: number;
  showGrowth?: boolean;
}) {
  return (
    <Link
      href={`/novel/${novel.id}`}
      className="group flex gap-3 rounded-2xl bg-surface p-2.5 ring-1 ring-white/5 transition-colors hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <NovelCover novel={novel} showTitle={false} className="w-[72px] shrink-0 rounded-lg" />
      <div className="flex min-w-0 flex-1 flex-col py-0.5">
        <div className="flex items-start gap-2">
          {rank !== undefined && (
            <span
              className={`text-lg font-black leading-tight tabular-nums ${
                rank <= 3 ? "text-accent" : "text-muted"
              }`}
            >
              <span className="sr-only">อันดับ </span>
              {rank}
            </span>
          )}
          <h3 className="line-clamp-2 text-[0.95rem] font-semibold leading-snug text-fg group-hover:text-accent-soft">
            {novel.title}
          </h3>
        </div>
        <p className="mt-0.5 truncate text-xs text-muted">{novel.author}</p>
        <ul className="mt-1.5 flex flex-wrap gap-1" aria-label="หมวดหมู่">
          {novel.genres.map((g) => (
            <li
              key={g}
              className="rounded-md bg-white/5 px-1.5 py-0.5 text-[0.65rem] text-fg/80"
            >
              {genreLabel(g)}
            </li>
          ))}
        </ul>
        <div className="mt-auto flex items-center gap-3 pt-1.5 text-xs text-muted">
          <span className="flex items-center gap-1">
            <EyeIcon className="size-3.5" />
            {formatCount(novel.views)}
            <span className="sr-only"> ครั้งที่อ่าน</span>
          </span>
          <span className="flex items-center gap-1 text-amber-300">
            <StarIcon className="size-3.5 fill-current" />
            <span className="sr-only">คะแนน </span>
            {novel.rating.toFixed(1)}
          </span>
          {showGrowth && novel.growth > 0 && (
            <span className="ml-auto flex items-center gap-1 rounded-md bg-emerald-500/15 px-1.5 py-0.5 font-semibold text-emerald-400">
              <TrendingIcon className="size-3.5" />
              <span className="sr-only">ยอดอ่านสัปดาห์นี้เพิ่มขึ้น </span>+
              {novel.growth}%
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
