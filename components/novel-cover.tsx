import type { Novel } from "@/lib/novels";

type Props = {
  novel: Pick<Novel, "title" | "author" | "cover">;
  className?: string;
  /** Show the title typeset on the cover. Off for very small thumbnails. */
  showTitle?: boolean;
};

/**
 * Generated placeholder cover: a CSS-only gradient with a subtle pattern,
 * so no image assets are downloaded. Decorative — callers render the real
 * title as text next to it.
 */
export function NovelCover({ novel, className = "", showTitle = true }: Props) {
  const [from, to] = novel.cover;
  return (
    <div
      aria-hidden="true"
      className={`relative isolate aspect-[3/4] overflow-hidden rounded-xl ring-1 ring-white/10 ${className}`}
      style={{
        backgroundImage: `radial-gradient(120% 80% at 80% 0%, ${from}cc 0%, transparent 60%), linear-gradient(160deg, ${from} 0%, ${to} 75%)`,
      }}
    >
      <div className="cover-pattern absolute inset-0 -z-10 opacity-40" />
      <div className="absolute -right-6 -top-6 size-24 rounded-full bg-white/10 blur-xl" />
      {showTitle && (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2.5 pt-8">
          <p className="line-clamp-3 text-[0.8rem] font-bold leading-snug text-white drop-shadow">
            {novel.title}
          </p>
          <p className="mt-0.5 truncate text-[0.65rem] text-white/70">
            {novel.author}
          </p>
        </div>
      )}
    </div>
  );
}
