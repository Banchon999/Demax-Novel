"use client";

import { useLiveQuery } from "dexie-react-hooks";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  BookIcon,
  ChatIcon,
  CheckIcon,
  DownloadIcon,
  LightbulbIcon,
  MoreIcon,
  PencilIcon,
  PlusIcon,
} from "@/components/icons";
import { NovelCover } from "@/components/novel-cover";
import { FORMAT_OPTIONS, ProjectForm } from "@/components/project/project-form";
import { ProjectNav } from "@/components/project/project-nav";
import { BackLink, PageTitle, TopBar } from "@/components/top-bar";
import {
  Button,
  ConfirmButton,
  EmptyState,
  Field,
  IconButton,
  Loading,
  ProgressBar,
  Segmented,
  Sheet,
  formatNumber,
  inputClass,
} from "@/components/ui";
import { dayKey, timeAgo } from "@/lib/dates";
import { db } from "@/lib/db";
import { exportProject } from "@/lib/db/backup";
import {
  createChapter,
  deleteChapter,
  deleteProject,
  moveChapter,
  projectChapters,
  updateChapterMeta,
  updateProject,
} from "@/lib/db/repo";
import type { Chapter, ChapterFormat } from "@/lib/db/schema";
import { downloadJson, safeFileName } from "@/lib/download";

export function ProjectView() {
  const id = useSearchParams().get("id") ?? "";
  const router = useRouter();
  const project = useLiveQuery(() => db.projects.get(id).then((p) => p ?? null), [id]);
  const chapters = useLiveQuery(() => projectChapters(id), [id]);
  const todayWords = useLiveQuery(
    () => db.writingDays.get(`${id}:${dayKey(new Date())}`).then((d) => d?.words ?? 0),
    [id],
  );
  const ideaCount = useLiveQuery(() => db.ideas.where("projectId").equals(id).count(), [id]);

  const [newChapter, setNewChapter] = useState(false);
  const [editing, setEditing] = useState(false);
  const [menuFor, setMenuFor] = useState<Chapter | null>(null);

  const totals = useMemo(() => {
    const list = chapters ?? [];
    return {
      words: list.reduce((s, c) => s + c.wordCount, 0),
      done: list.filter((c) => c.status === "done").length,
    };
  }, [chapters]);

  if (project === undefined || !chapters) return <Loading />;
  if (project === null) {
    return (
      <>
        <TopBar>
          <BackLink href="/" label="กลับหน้าเรื่องของฉัน" />
          <PageTitle>ไม่พบเรื่องนี้</PageTitle>
        </TopBar>
        <main id="main" className="px-4 py-10 text-center text-sm text-muted">
          เรื่องนี้อาจถูกลบไปแล้ว
        </main>
      </>
    );
  }

  return (
    <>
      <TopBar>
        <BackLink href="/" label="กลับหน้าเรื่องของฉัน" />
        <PageTitle>{project.title}</PageTitle>
        <IconButton label="แก้ไขข้อมูลเรื่อง" onClick={() => setEditing(true)}>
          <PencilIcon className="size-5" />
        </IconButton>
      </TopBar>
      <ProjectNav projectId={project.id} active="chapters" />

      <main id="main" className="mx-auto max-w-2xl space-y-5 px-4 pb-24 pt-4">
        <section className="flex gap-4">
          <NovelCover title={project.title} cover={project.cover} className="w-24 shrink-0" />
          <div className="min-w-0 flex-1 space-y-2">
            <p className="text-sm text-muted">
              {chapters.length} ตอน · เสร็จ {totals.done} · {formatNumber(totals.words)} คำ
            </p>
            {project.synopsis ? (
              <p className="line-clamp-4 whitespace-pre-line text-sm text-fg/85">{project.synopsis}</p>
            ) : (
              <p className="text-sm text-muted">ยังไม่มีเรื่องย่อ</p>
            )}
            {project.dailyGoal > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-muted">
                  วันนี้ {formatNumber(todayWords ?? 0)} / {formatNumber(project.dailyGoal)} คำ
                </p>
                <ProgressBar value={todayWords ?? 0} max={project.dailyGoal} />
              </div>
            )}
          </div>
        </section>

        <Link
          href={`/ideas?project=${project.id}`}
          className="flex items-center gap-2 rounded-xl bg-surface px-3 py-2.5 text-sm ring-1 ring-white/5 hover:ring-white/15"
        >
          <LightbulbIcon className="size-5 text-amber-300" />
          ไอเดียของเรื่องนี้
          <span className="ml-auto text-muted">{ideaCount ?? 0}</span>
        </Link>

        <section aria-labelledby="chapters-heading" className="space-y-3">
          <h2 id="chapters-heading" className="text-lg font-bold">
            สารบัญ
          </h2>
          {chapters.length === 0 ? (
            <EmptyState icon={<BookIcon className="size-7" />} title="ยังไม่มีตอน">
              กดปุ่ม “ตอนใหม่” ด้านล่างเพื่อเริ่มเขียน
            </EmptyState>
          ) : (
            <ol className="space-y-2">
              {chapters.map((c) => (
                <li key={c.id} className="flex items-stretch gap-1 rounded-2xl bg-surface ring-1 ring-white/5">
                  <Link href={`/write?id=${c.id}`} className="flex min-w-0 flex-1 items-center gap-3 p-3">
                    <span className="w-7 shrink-0 text-center text-sm font-bold text-muted">{c.order}</span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        {c.format === "chat" && <ChatIcon className="size-4 shrink-0 text-sky-300" />}
                        <span className="truncate font-semibold">{c.title}</span>
                      </span>
                      <span className="block text-xs text-muted">
                        {formatNumber(c.wordCount)} คำ · {timeAgo(c.updatedAt)}
                      </span>
                    </span>
                    {c.status === "done" && (
                      <span className="flex shrink-0 items-center gap-0.5 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[0.7rem] text-emerald-300">
                        <CheckIcon className="size-3" /> เสร็จ
                      </span>
                    )}
                  </Link>
                  <IconButton label={`ตัวเลือกของ ${c.title}`} className="m-auto mr-1" onClick={() => setMenuFor(c)}>
                    <MoreIcon className="size-5" />
                  </IconButton>
                </li>
              ))}
            </ol>
          )}
        </section>
      </main>

      <div className="pointer-events-none fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-30 mx-auto flex max-w-2xl justify-end px-4">
        <Button variant="primary" className="pointer-events-auto rounded-full shadow-lg shadow-accent/30" onClick={() => setNewChapter(true)}>
          <PlusIcon className="size-5" /> ตอนใหม่
        </Button>
      </div>

      <Sheet open={newChapter} onClose={() => setNewChapter(false)} title="เพิ่มตอนใหม่">
        <NewChapterForm
          defaultFormat={project.defaultFormat}
          nextOrder={chapters.length + 1}
          onCreate={async (format, title) => {
            const c = await createChapter(project.id, { format, title });
            setNewChapter(false);
            router.push(`/write?id=${c.id}`);
          }}
        />
      </Sheet>

      <Sheet open={editing} onClose={() => setEditing(false)} title="ข้อมูลเรื่อง">
        <div className="space-y-6">
          <ProjectForm
            initial={project}
            submitLabel="บันทึก"
            onSubmit={async (values) => {
              await updateProject(project.id, values);
              setEditing(false);
            }}
          />
          <div className="space-y-2 border-t border-white/10 pt-4">
            <Button
              className="w-full"
              onClick={async () => downloadJson(await exportProject(project.id), `${safeFileName(project.title)}.demax.json`)}
            >
              <DownloadIcon className="size-4" /> ดาวน์โหลดไฟล์สำรองเฉพาะเรื่องนี้
            </Button>
            <ConfirmButton
              className="w-full"
              confirmLabel="แตะอีกครั้ง — ลบทั้งเรื่องถาวร"
              onConfirm={async () => {
                await deleteProject(project.id);
                router.replace("/");
              }}
            >
              ลบเรื่องนี้
            </ConfirmButton>
          </div>
        </div>
      </Sheet>

      <Sheet open={menuFor !== null} onClose={() => setMenuFor(null)} title={menuFor?.title ?? "ตอน"}>
        {menuFor && (
          <ChapterMenu
            key={menuFor.id}
            chapter={menuFor}
            isFirst={menuFor.order === 1}
            isLast={menuFor.order === chapters.length}
            onDone={() => setMenuFor(null)}
          />
        )}
      </Sheet>
    </>
  );
}

function NewChapterForm({
  defaultFormat,
  nextOrder,
  onCreate,
}: {
  defaultFormat: ChapterFormat;
  nextOrder: number;
  onCreate: (format: ChapterFormat, title: string) => void;
}) {
  const [format, setFormat] = useState(defaultFormat);
  const [title, setTitle] = useState("");
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onCreate(format, title);
      }}
    >
      <Field label="ชื่อตอน (ไม่บังคับ)">
        <input
          className={inputClass}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={`ตอนที่ ${nextOrder}`}
        />
      </Field>
      <div className="space-y-1.5">
        <span className="text-sm font-medium text-fg/90">รูปแบบ</span>
        <Segmented label="รูปแบบตอน" value={format} options={FORMAT_OPTIONS} onChange={setFormat} />
      </div>
      <Button type="submit" variant="primary" className="w-full">
        เริ่มเขียน
      </Button>
    </form>
  );
}

function ChapterMenu({
  chapter,
  isFirst,
  isLast,
  onDone,
}: {
  chapter: Chapter;
  isFirst: boolean;
  isLast: boolean;
  onDone: () => void;
}) {
  const [title, setTitle] = useState(chapter.title);
  return (
    <div className="space-y-4">
      <form
        className="flex gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          await updateChapterMeta(chapter.id, { title: title.trim() || chapter.title });
          onDone();
        }}
      >
        <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} aria-label="ชื่อตอน" />
        <Button type="submit" variant="primary">
          บันทึก
        </Button>
      </form>
      <Button
        className="w-full"
        onClick={async () => {
          await updateChapterMeta(chapter.id, { status: chapter.status === "done" ? "draft" : "done" });
          onDone();
        }}
      >
        <CheckIcon className="size-4" />
        {chapter.status === "done" ? "เปลี่ยนเป็นฉบับร่าง" : "ทำเครื่องหมายว่าเสร็จแล้ว"}
      </Button>
      <div className="grid grid-cols-2 gap-2">
        <Button disabled={isFirst} onClick={() => moveChapter(chapter.id, -1).then(onDone)}>
          <ArrowUpIcon className="size-4" /> เลื่อนขึ้น
        </Button>
        <Button disabled={isLast} onClick={() => moveChapter(chapter.id, 1).then(onDone)}>
          <ArrowDownIcon className="size-4" /> เลื่อนลง
        </Button>
      </div>
      <ConfirmButton className="w-full" onConfirm={() => deleteChapter(chapter.id).then(onDone)}>
        ลบตอนนี้
      </ConfirmButton>
    </div>
  );
}
