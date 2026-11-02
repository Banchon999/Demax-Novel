"use client";

import { useLiveQuery } from "dexie-react-hooks";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { BookIcon, ChatIcon, FlameIcon, PlusIcon, TargetIcon } from "@/components/icons";
import { NovelCover } from "@/components/novel-cover";
import { ProjectForm } from "@/components/project/project-form";
import { Button, EmptyState, Loading, ProgressBar, Sheet, formatNumber } from "@/components/ui";
import { dayKey, streakDays, timeAgo } from "@/lib/dates";
import { db } from "@/lib/db";
import { LAST_BACKUP_KEY } from "@/lib/db/backup";
import { createProject } from "@/lib/db/repo";
import { useNow } from "@/lib/hooks/use-now";
import { useSetting } from "@/lib/hooks/use-setting";

const BACKUP_REMIND_MS = 7 * 86_400_000;

export function HomeView() {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const projects = useLiveQuery(() => db.projects.orderBy("updatedAt").reverse().toArray());
  const chapters = useLiveQuery(() => db.chapters.toArray());
  const days = useLiveQuery(() => db.writingDays.toArray());
  const [lastBackup] = useSetting<number>(LAST_BACKUP_KEY, 0);

  const now = useNow();
  const today = dayKey(new Date(now));
  const stats = useMemo(() => {
    const perProject = new Map<string, { chapters: number; words: number; today: number }>();
    for (const c of chapters ?? []) {
      const s = perProject.get(c.projectId) ?? { chapters: 0, words: 0, today: 0 };
      s.chapters++;
      s.words += c.wordCount;
      perProject.set(c.projectId, s);
    }
    const written = new Set<string>();
    let todayTotal = 0;
    for (const d of days ?? []) {
      if (d.words > 0) written.add(d.date);
      if (d.date === today) {
        todayTotal += d.words;
        const s = perProject.get(d.projectId);
        if (s) s.today += d.words;
      }
    }
    const last = [...(chapters ?? [])].sort((a, b) => b.updatedAt - a.updatedAt)[0];
    return { perProject, todayTotal, streak: streakDays(written, new Date(now)), last };
  }, [chapters, days, today, now]);

  if (!projects || !chapters || !days) return <Loading />;

  const lastProject = stats.last && projects.find((p) => p.id === stats.last?.projectId);
  const needsBackup = projects.length > 0 && now - lastBackup > BACKUP_REMIND_MS;

  return (
    <main id="main" className="mx-auto max-w-2xl space-y-5 px-4 pt-4">
      <section aria-label="สรุปวันนี้" className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-surface p-4 ring-1 ring-white/5">
          <p className="flex items-center gap-1.5 text-xs text-muted">
            <TargetIcon className="size-4" /> วันนี้เขียนไป
          </p>
          <p className="mt-1 text-2xl font-extrabold">
            {formatNumber(stats.todayTotal)} <span className="text-sm font-medium text-muted">คำ</span>
          </p>
        </div>
        <div className="rounded-2xl bg-surface p-4 ring-1 ring-white/5">
          <p className="flex items-center gap-1.5 text-xs text-muted">
            <FlameIcon className="size-4 text-orange-400" /> เขียนต่อเนื่อง
          </p>
          <p className="mt-1 text-2xl font-extrabold">
            {stats.streak} <span className="text-sm font-medium text-muted">วัน</span>
          </p>
        </div>
      </section>

      {needsBackup && (
        <Link
          href="/settings"
          className="block rounded-2xl bg-amber-500/10 p-3 text-sm text-amber-200 ring-1 ring-amber-500/30"
        >
          {lastBackup ? `สำรองข้อมูลล่าสุด ${timeAgo(lastBackup)}` : "ยังไม่เคยสำรองข้อมูล"} — ข้อมูลอยู่ในเครื่องนี้เท่านั้น
          แตะเพื่อดาวน์โหลดไฟล์สำรอง
        </Link>
      )}

      {stats.last && lastProject && (
        <Link
          href={`/write?id=${stats.last.id}`}
          className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-accent/25 to-fuchsia-500/10 p-4 ring-1 ring-accent/30 hover:ring-accent/60"
        >
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent text-white">
            {stats.last.format === "chat" ? <ChatIcon className="size-5" /> : <BookIcon className="size-5" />}
          </span>
          <span className="min-w-0">
            <span className="block text-xs text-accent-soft">เขียนต่อจากล่าสุด</span>
            <span className="block truncate font-bold">{stats.last.title}</span>
            <span className="block truncate text-xs text-muted">
              {lastProject.title} · {timeAgo(stats.last.updatedAt)}
            </span>
          </span>
        </Link>
      )}

      <section aria-labelledby="projects-heading" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 id="projects-heading" className="text-xl font-bold">
            เรื่องของฉัน
          </h2>
          <Button variant="primary" onClick={() => setCreating(true)} className="min-h-10 px-3">
            <PlusIcon className="size-4" /> เรื่องใหม่
          </Button>
        </div>

        {projects.length === 0 ? (
          <EmptyState icon={<BookIcon className="size-7" />} title="ยังไม่มีเรื่อง">
            กด “เรื่องใหม่” เพื่อเริ่มแต่งเรื่องแรก
          </EmptyState>
        ) : (
          <ul className="space-y-2.5">
            {projects.map((p) => {
              const s = stats.perProject.get(p.id) ?? { chapters: 0, words: 0, today: 0 };
              return (
                <li key={p.id}>
                  <Link
                    href={`/project?id=${p.id}`}
                    className="flex gap-3 rounded-2xl bg-surface p-3 ring-1 ring-white/5 hover:ring-white/15"
                  >
                    <NovelCover title={p.title} cover={p.cover} className="w-16 shrink-0" showTitle={false} />
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="truncate font-bold">{p.title}</p>
                      <p className="text-xs text-muted">
                        {s.chapters} ตอน · {formatNumber(s.words)} คำ · แก้ไข {timeAgo(p.updatedAt)}
                      </p>
                      {p.dailyGoal > 0 && (
                        <div className="space-y-1 pt-1">
                          <p className="text-[0.7rem] text-muted">
                            วันนี้ {formatNumber(s.today)} / {formatNumber(p.dailyGoal)} คำ
                          </p>
                          <ProgressBar value={s.today} max={p.dailyGoal} />
                        </div>
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <Sheet open={creating} onClose={() => setCreating(false)} title="สร้างเรื่องใหม่">
        <ProjectForm
          submitLabel="สร้างเรื่อง"
          onSubmit={async (values) => {
            const p = await createProject(values);
            setCreating(false);
            router.push(`/project?id=${p.id}`);
          }}
        />
      </Sheet>
    </main>
  );
}
