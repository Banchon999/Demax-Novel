import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookmarkButton } from "@/components/bookmark-button";
import {
  BookIcon,
  ChevronLeftIcon,
  EyeIcon,
  HeartIcon,
  StarIcon,
} from "@/components/icons";
import { NovelCard } from "@/components/novel-card";
import { NovelCover } from "@/components/novel-cover";
import { TopBar } from "@/components/top-bar";
import {
  NOVELS,
  STATUS_LABELS,
  formatCount,
  formatDate,
  genreLabel,
  getNovel,
} from "@/lib/novels";

export function generateStaticParams() {
  return NOVELS.map((n) => ({ id: n.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/novel/[id]">): Promise<Metadata> {
  const novel = getNovel((await params).id);
  return novel
    ? { title: novel.title, description: novel.synopsis }
    : { title: "ไม่พบนิยาย" };
}

/** Mock chapter list: latest chapters first, one every 2 days back from updatedAt. */
function recentChapters(latest: number, updatedAt: string, count = 5) {
  const base = new Date(`${updatedAt}T00:00:00+07:00`).getTime();
  return Array.from({ length: Math.min(count, latest) }, (_, i) => ({
    number: latest - i,
    date: new Date(base - i * 2 * 86_400_000).toISOString().slice(0, 10),
  }));
}

export default async function NovelPage({ params }: PageProps<"/novel/[id]">) {
  const novel = getNovel((await params).id);
  if (!novel) notFound();

  const related = NOVELS.filter(
    (n) => n.id !== novel.id && n.genres.some((g) => novel.genres.includes(g)),
  )
    .sort((a, b) => b.views - a.views)
    .slice(0, 6);

  const stats = [
    { icon: EyeIcon, value: formatCount(novel.views), label: "ยอดอ่าน" },
    { icon: HeartIcon, value: formatCount(novel.likes), label: "ถูกใจ" },
    { icon: StarIcon, value: novel.rating.toFixed(1), label: "คะแนน" },
    { icon: BookIcon, value: novel.chapters.toLocaleString("th-TH"), label: "ตอน" },
  ];

  return (
    <>
      <TopBar>
        <Link
          href="/"
          className="-ml-2 flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-fg/85 hover:bg-white/10 hover:text-fg focus-visible:outline-2 focus-visible:outline-accent"
        >
          <ChevronLeftIcon className="size-5" />
          หน้าแรก
        </Link>
      </TopBar>

      <main id="main" className="mx-auto max-w-2xl pb-6">
        <div
          className="relative overflow-hidden px-4 pb-5 pt-6"
          style={{
            backgroundImage: `linear-gradient(180deg, ${novel.cover[0]}55 0%, transparent 100%)`,
          }}
        >
          <div className="flex gap-4">
            <NovelCover novel={novel} className="w-32 shrink-0 shadow-2xl sm:w-40" />
            <div className="min-w-0 flex-1 py-1">
              <h1 className="text-xl font-bold leading-snug sm:text-2xl">{novel.title}</h1>
              <p className="mt-1 text-sm text-muted">โดย {novel.author}</p>
              <p className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-white/10 px-2 py-0.5 text-xs">
                <span
                  aria-hidden="true"
                  className={`size-1.5 rounded-full ${
                    novel.status === "ongoing" ? "bg-emerald-400" : "bg-sky-400"
                  }`}
                />
                {STATUS_LABELS[novel.status]}
              </p>
              <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="หมวดหมู่">
                {novel.genres.map((g) => (
                  <li key={g}>
                    <Link
                      href={`/search?genre=${g}`}
                      className="block rounded-full bg-accent/15 px-2.5 py-1 text-xs text-accent-soft hover:bg-accent/25 focus-visible:outline-2 focus-visible:outline-accent"
                    >
                      {genreLabel(g)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <dl className="mt-5 grid grid-cols-4 divide-x divide-white/10 rounded-2xl bg-black/30 py-3 ring-1 ring-white/10 backdrop-blur">
            {stats.map(({ icon: Icon, value, label }) => (
              <div key={label} className="flex flex-col items-center gap-0.5 px-1">
                <Icon className="size-4 text-muted" />
                <dt className="order-last text-[0.7rem] text-muted">{label}</dt>
                <dd className="text-sm font-bold tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-4 flex gap-2">
            <BookmarkButton novelId={novel.id} />
          </div>
        </div>

        <section aria-labelledby="synopsis-heading" className="px-4">
          <h2 id="synopsis-heading" className="text-base font-bold">
            เรื่องย่อ
          </h2>
          <p className="mt-2 text-[0.95rem] leading-relaxed text-fg/85">{novel.synopsis}</p>
          <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="แท็ก">
            {novel.tags.map((t) => (
              <li key={t} className="rounded-md bg-surface px-2 py-1 text-xs text-muted">
                #{t}
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="chapters-heading" className="mt-6 px-4">
          <div className="flex items-baseline justify-between">
            <h2 id="chapters-heading" className="text-base font-bold">
              ตอนล่าสุด
            </h2>
            <p className="text-xs text-muted">
              ทั้งหมด {novel.chapters.toLocaleString("th-TH")} ตอน
            </p>
          </div>
          <ol className="mt-2 divide-y divide-white/5 overflow-hidden rounded-2xl bg-surface ring-1 ring-white/5">
            {recentChapters(novel.chapters, novel.updatedAt).map((ch) => (
              <li key={ch.number} className="flex items-center justify-between px-4 py-3 text-sm">
                <span>ตอนที่ {ch.number.toLocaleString("th-TH")}</span>
                <time dateTime={ch.date} className="text-xs text-muted">
                  {formatDate(ch.date)}
                </time>
              </li>
            ))}
          </ol>
          <p className="mt-2 text-center text-xs text-muted">ระบบอ่านนิยายจะเปิดให้บริการเร็ว ๆ นี้</p>
        </section>

        {related.length > 0 && (
          <section aria-labelledby="related-heading" className="mt-8">
            <h2 id="related-heading" className="mb-3 px-4 text-base font-bold">
              เรื่องที่คล้ายกัน
            </h2>
            <ul className="scroller flex snap-x gap-3 overflow-x-auto scroll-px-4 px-4 pb-1">
              {related.map((n) => (
                <li key={n.id} className="w-[30%] max-w-32 shrink-0 snap-start">
                  <NovelCard novel={n} />
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </>
  );
}
