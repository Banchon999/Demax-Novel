import Link from "next/link";
import { FlameIcon, TrendingIcon } from "@/components/icons";
import { NovelCard, NovelRow } from "@/components/novel-card";
import { SectionHeader } from "@/components/section-header";
import { TopBar } from "@/components/top-bar";
import {
  GENRES,
  NOVELS,
  formatCount,
  getPopular,
  getTrending,
} from "@/lib/novels";

export default function HomePage() {
  const popular = getPopular(10);
  const trending = getTrending(6);
  const latest = [...NOVELS]
    .filter((n) => n.status === "ongoing")
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 6);
  const weeklyTotal = NOVELS.reduce((sum, n) => sum + n.weeklyViews, 0);

  return (
    <>
      <TopBar />
      <main id="main" className="mx-auto max-w-2xl space-y-8 pt-4">
        <section aria-labelledby="popular-heading">
          <SectionHeader
            id="popular-heading"
            title="ยอดฮิต"
            subtitle="นิยายที่มียอดอ่านสูงสุดตลอดกาล"
            icon={<FlameIcon className="size-5 text-orange-400" />}
            moreHref="/search?sort=views"
          />
          <ol
            className="scroller flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-1"
            aria-label="รายการนิยายยอดฮิต"
          >
            {popular.map((novel, i) => (
              <li key={novel.id} className="w-[38%] max-w-40 shrink-0 snap-start sm:w-36">
                <NovelCard novel={novel} rank={i + 1} />
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="trending-heading">
          <SectionHeader
            id="trending-heading"
            title="มาแรง"
            subtitle={`ยอดอ่านพุ่งแรงในสัปดาห์นี้ · รวม ${formatCount(weeklyTotal)} ครั้ง`}
            icon={<TrendingIcon className="size-5 text-emerald-400" />}
            moreHref="/search?sort=trending"
          />
          <ol className="grid gap-2.5 px-4 sm:grid-cols-2">
            {trending.map((novel, i) => (
              <li key={novel.id}>
                <NovelRow novel={novel} rank={i + 1} showGrowth />
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="genres-heading">
          <SectionHeader id="genres-heading" title="หมวดหมู่" />
          <ul className="flex flex-wrap gap-2 px-4">
            {GENRES.map((g) => (
              <li key={g.id}>
                <Link
                  href={`/search?genre=${g.id}`}
                  className="block rounded-full bg-surface px-4 py-2 text-sm text-fg/90 ring-1 ring-white/10 transition-colors hover:bg-surface-2 hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  {g.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="latest-heading" className="pb-4">
          <SectionHeader
            id="latest-heading"
            title="อัปเดตล่าสุด"
            moreHref="/search?sort=updated"
          />
          <ul className="grid grid-cols-3 gap-x-3 gap-y-5 px-4">
            {latest.map((novel) => (
              <li key={novel.id}>
                <NovelCard novel={novel} />
              </li>
            ))}
          </ul>
        </section>
      </main>
    </>
  );
}
