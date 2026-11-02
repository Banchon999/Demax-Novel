"use client";

import { useLiveQuery } from "dexie-react-hooks";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  HistoryIcon,
  MaximizeIcon,
  MinimizeIcon,
  MoreIcon,
} from "@/components/icons";
import { BackLink } from "@/components/top-bar";
import { Button, Field, IconButton, Loading, ProgressBar, Segmented, Sheet, formatNumber, inputClass } from "@/components/ui";
import { dayKey } from "@/lib/dates";
import { db } from "@/lib/db";
import { createSnapshot, maybeAutoSnapshot, projectChapters, restoreSnapshot, updateChapterMeta } from "@/lib/db/repo";
import type { Beat, Chapter, ChapterContent, PlotThread, Project } from "@/lib/db/schema";
import { SAVE_LABELS, useAutosave } from "@/lib/hooks/use-autosave";
import { FONT_SIZES, useSetting, type FontSizeKey } from "@/lib/hooks/use-setting";
import { useVisualViewport } from "@/lib/hooks/use-visual-viewport";
import { useCodex } from "@/lib/hooks/use-codex";
import { MentionCard } from "./mention-card";
import { ChatEditor } from "./chat-editor";
import { ProseEditor } from "./prose-editor";
import { SnapshotsPanel } from "./snapshots-sheet";

export function WriteView() {
  const id = useSearchParams().get("id") ?? "";
  const chapter = useLiveQuery(() => db.chapters.get(id).then((c) => c ?? null), [id]);
  const project = useLiveQuery(
    () => (chapter ? db.projects.get(chapter.projectId).then((p) => p ?? null) : null),
    [chapter?.projectId],
  );

  if (chapter === undefined || (chapter && project === undefined)) return <Loading />;
  if (!chapter || !project) {
    return (
      <main id="main" className="px-4 py-16 text-center">
        <p className="font-semibold">ไม่พบตอนนี้</p>
        <Link href="/" className="mt-4 inline-block text-accent-soft underline">
          กลับหน้าเรื่องของฉัน
        </Link>
      </main>
    );
  }
  // Keyed so each chapter gets a fresh editor and autosave queue.
  return <WriteSession key={chapter.id} chapter={chapter} project={project} />;
}

function WriteSession({ chapter, project }: { chapter: Chapter; project: Project }) {
  const vv = useVisualViewport();
  const { state, queue, flush } = useAutosave(chapter.id);
  const [fontKey, setFontKey] = useSetting<FontSizeKey>("editorFontSize", "m");
  const [focus, setFocus] = useState(false);
  const [sheet, setSheet] = useState<"menu" | "history" | null>(null);
  // The editors are uncontrolled after mount; bumping `version` remounts them
  // with `initial` (used after restoring a snapshot).
  const [initial, setInitial] = useState<ChapterContent>(chapter.content);
  const [version, setVersion] = useState(0);

  const siblings = useLiveQuery(() => projectChapters(project.id), [project.id]);
  const codex = useCodex(project.id);
  const [mention, setMention] = useState<string | null>(null);
  const colorOf = useCallback(
    (id: string) => codex.typeById.get(codex.entityById.get(id)?.typeId ?? "")?.color ?? "#a78bfa",
    [codex],
  );
  const chapterOrder = useMemo(() => new Map((siblings ?? []).map((c) => [c.id, c.order])), [siblings]);
  const characters = useMemo(
    () =>
      codex.entities
        .filter((e) => codex.typeById.get(e.typeId)?.name === "ตัวละคร")
        .map((e) => ({ id: e.id, name: e.name, icon: codex.typeById.get(e.typeId)?.icon ?? "👤" })),
    [codex],
  );
  const mentioned = mention ? codex.entityById.get(mention) : undefined;
  const plan = useLiveQuery(async () => {
    const [beats, threads] = await Promise.all([
      db.beats.where("chapterId").equals(chapter.id).toArray(),
      db.threads.where("projectId").equals(project.id).toArray(),
    ]);
    return {
      beats,
      planted: threads.filter((t) => t.plantChapterId === chapter.id),
      payoffs: threads.filter((t) => t.payoffChapterId === chapter.id),
      open: threads.filter((t) => t.status === "open"),
    };
  }, [chapter.id, project.id]);
  const todayWords = useLiveQuery(
    () => db.writingDays.get(`${project.id}:${dayKey(new Date())}`).then((d) => d?.words ?? 0),
    [project.id],
  );

  useEffect(() => {
    // Opening a chapter records where it started, so a bad session is undoable.
    void maybeAutoSnapshot(chapter.id, 0);
  }, [chapter.id]);

  const fontSize = FONT_SIZES[fontKey] ?? FONT_SIZES.m;
  const prev = siblings?.find((c) => c.order === chapter.order - 1);
  const next = siblings?.find((c) => c.order === chapter.order + 1);

  async function restore(snapshotId: string) {
    await flush();
    await restoreSnapshot(snapshotId);
    const fresh = await db.chapters.get(chapter.id);
    if (fresh) setInitial(fresh.content);
    setVersion((v) => v + 1);
    setSheet(null);
  }

  return (
    <div
      className="fixed inset-x-0 top-0 z-40 flex flex-col bg-bg"
      style={vv.height ? { height: vv.height, transform: `translateY(${vv.offsetTop}px)` } : { height: "100dvh" }}
    >
      {!focus && (
        <header className="flex h-14 shrink-0 items-center gap-1 border-b border-white/5 px-1 pt-[env(safe-area-inset-top)]">
          <BackLink href={`/project?id=${project.id}`} label={`กลับไปสารบัญ ${project.title}`} />
          <button type="button" onClick={() => setSheet("menu")} className="min-w-0 flex-1 text-left">
            <span className="block truncate text-sm font-bold">{chapter.title}</span>
            <span className={`block text-[0.7rem] ${state === "error" ? "text-red-300" : "text-muted"}`} aria-live="polite">
              {SAVE_LABELS[state]}
            </span>
          </button>
          <IconButton label="ประวัติเวอร์ชัน" onClick={() => setSheet("history")}>
            <HistoryIcon className="size-5" />
          </IconButton>
          <IconButton label="โหมดโฟกัส" onClick={() => setFocus(true)}>
            <MaximizeIcon className="size-5" />
          </IconButton>
          <IconButton label="ตัวเลือก" onClick={() => setSheet("menu")}>
            <MoreIcon className="size-5" />
          </IconButton>
        </header>
      )}
      {focus && (
        <IconButton
          label="ออกจากโหมดโฟกัส"
          onClick={() => setFocus(false)}
          className="absolute right-2 top-[calc(0.5rem+env(safe-area-inset-top))] z-10 bg-surface/80"
        >
          <MinimizeIcon className="size-5" />
        </IconButton>
      )}

      {initial.kind === "prose" ? (
        <ProseEditor
          key={version}
          initial={initial}
          onChange={queue}
          fontSize={fontSize}
          showToolbar={!focus}
          terms={codex.terms}
          colorOf={colorOf}
          onMention={setMention}
          overlay={
            mentioned && (
              <MentionCard
                entity={mentioned}
                type={codex.typeById.get(mentioned.typeId)}
                chapterOrder={chapterOrder}
                atOrder={chapter.order}
                onClose={() => setMention(null)}
              />
            )
          }
        />
      ) : (
        <ChatEditor
          key={version}
          initial={initial}
          onChange={queue}
          fontSize={fontSize}
          terms={codex.terms}
          colorOf={colorOf}
          characters={characters}
        />
      )}

      {!focus && (
        <footer className="shrink-0 space-y-1 border-t border-white/5 px-4 pb-[calc(0.4rem+env(safe-area-inset-bottom))] pt-1.5 text-[0.7rem] text-muted">
          <div className="flex justify-between gap-2">
            <span>
              ตอนนี้ {formatNumber(chapter.wordCount)} คำ · {formatNumber(chapter.charCount)} ตัวอักษร
            </span>
            {project.dailyGoal > 0 && (
              <span>
                วันนี้ {formatNumber(todayWords ?? 0)}/{formatNumber(project.dailyGoal)}
              </span>
            )}
          </div>
          {project.dailyGoal > 0 && <ProgressBar value={todayWords ?? 0} max={project.dailyGoal} />}
        </footer>
      )}

      <Sheet open={sheet === "menu"} onClose={() => setSheet(null)} title="ตัวเลือกของตอน">
        {sheet === "menu" && (
          <ChapterOptions
            plan={plan}
            projectId={project.id}
            chapter={chapter}
            fontKey={fontKey}
            onFontKey={setFontKey}
            prev={prev}
            next={next}
            onHistory={() => setSheet("history")}
            onDone={() => setSheet(null)}
          />
        )}
      </Sheet>
      <Sheet open={sheet === "history"} onClose={() => setSheet(null)} title="ประวัติเวอร์ชัน">
        {sheet === "history" && (
          <SnapshotsPanel
            chapterId={chapter.id}
            onCreate={async (label) => {
              await flush();
              await createSnapshot(chapter.id, { label: label || "บันทึกด้วยตัวเอง" });
            }}
            onRestore={(s) => restore(s.id)}
          />
        )}
      </Sheet>
    </div>
  );
}

const FONT_OPTIONS: { value: FontSizeKey; label: string }[] = [
  { value: "s", label: "เล็ก" },
  { value: "m", label: "กลาง" },
  { value: "l", label: "ใหญ่" },
  { value: "xl", label: "ใหญ่มาก" },
];

type ChapterPlan = { beats: Beat[]; planted: PlotThread[]; payoffs: PlotThread[]; open: PlotThread[] };

function ChapterOptions({
  plan,
  projectId,
  chapter,
  fontKey,
  onFontKey,
  prev,
  next,
  onHistory,
  onDone,
}: {
  plan?: ChapterPlan;
  projectId: string;
  chapter: Chapter;
  fontKey: FontSizeKey;
  onFontKey: (k: FontSizeKey) => void;
  prev?: Chapter;
  next?: Chapter;
  onHistory: () => void;
  onDone: () => void;
}) {
  const [title, setTitle] = useState(chapter.title);
  const hasPlan = plan && (plan.beats.length || plan.planted.length || plan.payoffs.length);
  return (
    <div className="space-y-5">
      <section className="space-y-2 rounded-xl bg-surface-2 p-3 ring-1 ring-white/5" aria-label="แผนของตอนนี้">
        <p className="text-sm font-bold">แผนของตอนนี้</p>
        {hasPlan ? (
          <ul className="space-y-1 text-sm">
            {plan.beats.map((b) => (
              <li key={b.id}>
                {b.done ? "✓" : "○"} {b.title} <span className="text-xs text-muted">(ตึงเครียด {b.tension}/10)</span>
              </li>
            ))}
            {plan.planted.map((t) => (
              <li key={t.id}>🧵 ปูปม: {t.title}</li>
            ))}
            {plan.payoffs.map((t) => (
              <li key={t.id}>🎯 เฉลยปม: {t.title}</li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted">ยังไม่ได้วางจังหวะหรือปมไว้ในตอนนี้</p>
        )}
        {plan && plan.open.length > 0 && <p className="text-xs text-amber-200">ปมที่ยังไม่เฉลยทั้งเรื่อง: {plan.open.length}</p>}
        <Link href={`/plot?p=${projectId}`} className="inline-block text-xs font-semibold text-accent-soft underline">
          เปิดแท็บพล็อต
        </Link>
      </section>
      <form
        className="space-y-2"
        onSubmit={async (e) => {
          e.preventDefault();
          await updateChapterMeta(chapter.id, { title: title.trim() || chapter.title });
          onDone();
        }}
      >
        <Field label="ชื่อตอน">
          <div className="flex gap-2">
            <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} />
            <Button type="submit" variant="primary">
              บันทึก
            </Button>
          </div>
        </Field>
      </form>
      <Button
        className="w-full"
        onClick={() => updateChapterMeta(chapter.id, { status: chapter.status === "done" ? "draft" : "done" }).then(onDone)}
      >
        {chapter.status === "done" ? "เปลี่ยนกลับเป็นฉบับร่าง" : "ทำเครื่องหมายว่าตอนนี้เสร็จแล้ว"}
      </Button>
      <div className="space-y-1.5">
        <span className="text-sm font-medium text-fg/90">ขนาดตัวอักษร</span>
        <Segmented label="ขนาดตัวอักษร" value={fontKey} options={FONT_OPTIONS} onChange={onFontKey} />
      </div>
      <Button className="w-full" onClick={onHistory}>
        ประวัติเวอร์ชัน / กู้คืน
      </Button>
      <div className="grid grid-cols-2 gap-2">
        {prev ? (
          <Link href={`/write?id=${prev.id}`} className="flex min-h-11 items-center gap-1 rounded-xl bg-surface-2 px-3 text-sm ring-1 ring-white/10">
            <ChevronLeftIcon className="size-4 shrink-0" />
            <span className="truncate">{prev.title}</span>
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link href={`/write?id=${next.id}`} className="flex min-h-11 items-center justify-end gap-1 rounded-xl bg-surface-2 px-3 text-sm ring-1 ring-white/10">
            <span className="truncate">{next.title}</span>
            <ChevronRightIcon className="size-4 shrink-0" />
          </Link>
        )}
      </div>
    </div>
  );
}
