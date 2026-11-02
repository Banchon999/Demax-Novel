import Dexie from "dexie";
import { dayKey } from "@/lib/dates";
import { chapterCountableText } from "@/lib/text/plain-text";
import { countText } from "@/lib/text/wordcount";
import { db } from "./index";
import type {
  Chapter,
  ChapterContent,
  ChapterFormat,
  ChapterStatus,
  Idea,
  Project,
  Snapshot,
} from "./schema";

export const MAX_AUTO_SNAPSHOTS = 30;
export const AUTO_SNAPSHOT_INTERVAL = 10 * 60_000;

const COVERS: [string, string][] = [
  ["#8b5cf6", "#1e1b4b"],
  ["#ec4899", "#4a044e"],
  ["#f97316", "#431407"],
  ["#10b981", "#022c22"],
  ["#0ea5e9", "#082f49"],
  ["#eab308", "#422006"],
  ["#ef4444", "#450a0a"],
  ["#14b8a6", "#042f2e"],
];

export const newId = () => crypto.randomUUID();

export function emptyContent(format: ChapterFormat): ChapterContent {
  return format === "prose"
    ? { kind: "prose", doc: { type: "doc", content: [{ type: "paragraph" }] } }
    : { kind: "chat", chat: { cast: [], messages: [] } };
}

// --- Projects ---

export async function createProject(input: {
  title: string;
  synopsis?: string;
  defaultFormat?: ChapterFormat;
  dailyGoal?: number;
}): Promise<Project> {
  const now = Date.now();
  const project: Project = {
    id: newId(),
    title: input.title.trim() || "เรื่องใหม่",
    synopsis: input.synopsis?.trim() ?? "",
    cover: COVERS[Math.floor(Math.random() * COVERS.length)],
    defaultFormat: input.defaultFormat ?? "prose",
    dailyGoal: input.dailyGoal ?? 1000,
    createdAt: now,
    updatedAt: now,
  };
  await db.projects.add(project);
  return project;
}

export async function updateProject(
  id: string,
  patch: Partial<Pick<Project, "title" | "synopsis" | "defaultFormat" | "dailyGoal" | "cover">>,
) {
  await db.projects.update(id, { ...patch, updatedAt: Date.now() });
}

export async function deleteProject(id: string) {
  await db.transaction(
    "rw",
    [db.projects, db.chapters, db.snapshots, db.ideas, db.writingDays, db.entityTypes, db.entities, db.links],
    async () => {
      await Promise.all([
        db.chapters.where("projectId").equals(id).delete(),
        db.snapshots.where("projectId").equals(id).delete(),
        db.ideas.where("projectId").equals(id).delete(),
        db.writingDays.where("projectId").equals(id).delete(),
        db.entityTypes.where("projectId").equals(id).delete(),
        db.entities.where("projectId").equals(id).delete(),
        db.links.where("projectId").equals(id).delete(),
      ]);
      await db.projects.delete(id);
    },
  );
}

const touchProject = (projectId: string, now: number) =>
  db.projects.update(projectId, { updatedAt: now });

// --- Chapters ---

export function projectChapters(projectId: string): Promise<Chapter[]> {
  return db.chapters.where("projectId").equals(projectId).sortBy("order");
}

export async function createChapter(
  projectId: string,
  input: { format: ChapterFormat; title?: string },
): Promise<Chapter> {
  return db.transaction("rw", db.chapters, db.projects, async () => {
    const count = await db.chapters.where("projectId").equals(projectId).count();
    const now = Date.now();
    const order = count + 1;
    const chapter: Chapter = {
      id: newId(),
      projectId,
      order,
      title: input.title?.trim() || `ตอนที่ ${order}`,
      format: input.format,
      content: emptyContent(input.format),
      wordCount: 0,
      charCount: 0,
      status: "draft",
      createdAt: now,
      updatedAt: now,
    };
    await db.chapters.add(chapter);
    await touchProject(projectId, now);
    return chapter;
  });
}

export async function updateChapterMeta(
  id: string,
  patch: Partial<{ title: string; status: ChapterStatus }>,
) {
  await db.chapters.update(id, { ...patch, updatedAt: Date.now() });
}

export async function moveChapter(id: string, direction: -1 | 1) {
  await db.transaction("rw", db.chapters, async () => {
    const chapter = await db.chapters.get(id);
    if (!chapter) return;
    const neighbour = await db.chapters
      .where("[projectId+order]")
      .equals([chapter.projectId, chapter.order + direction])
      .first();
    if (!neighbour) return;
    await db.chapters.update(chapter.id, { order: neighbour.order });
    await db.chapters.update(neighbour.id, { order: chapter.order });
  });
}

export async function deleteChapter(id: string) {
  await db.transaction("rw", db.chapters, db.snapshots, async () => {
    const chapter = await db.chapters.get(id);
    if (!chapter) return;
    await db.snapshots.where("chapterId").equals(id).delete();
    await db.chapters.delete(id);
    const rest = await projectChapters(chapter.projectId);
    await Promise.all(
      rest.map((c, i) => (c.order === i + 1 ? null : db.chapters.update(c.id, { order: i + 1 }))),
    );
  });
}

/**
 * Persists chapter content and credits the net word change to the writer's
 * log for `now`'s day (clamped at zero so a big deletion can't go negative).
 */
export async function saveChapterContent(id: string, content: ChapterContent, now = new Date()) {
  await db.transaction("rw", db.chapters, db.writingDays, db.projects, async () => {
    const chapter = await db.chapters.get(id);
    if (!chapter) return;
    const { words, chars } = countText(chapterCountableText(content));
    const delta = words - chapter.wordCount;
    const ts = now.getTime();
    await db.chapters.update(id, { content, wordCount: words, charCount: chars, updatedAt: ts });
    await touchProject(chapter.projectId, ts);
    if (delta === 0) return;
    const date = dayKey(now);
    const key = `${chapter.projectId}:${date}`;
    const day = await db.writingDays.get(key);
    const next = Math.max(0, (day?.words ?? 0) + delta);
    await db.writingDays.put({ key, projectId: chapter.projectId, date, words: next });
  });
}

// --- Snapshots ---

export async function createSnapshot(
  chapterId: string,
  opts: { label?: string; auto?: boolean } = {},
  now = new Date(),
): Promise<Snapshot> {
  return db.transaction("rw", db.chapters, db.snapshots, async () => {
    const chapter = await db.chapters.get(chapterId);
    if (!chapter) throw new Error("ไม่พบตอนนี้");
    const snapshot: Snapshot = {
      id: newId(),
      chapterId,
      projectId: chapter.projectId,
      content: chapter.content,
      wordCount: chapter.wordCount,
      label: opts.label?.trim() ?? "",
      auto: opts.auto ?? false,
      createdAt: now.getTime(),
    };
    await db.snapshots.add(snapshot);
    if (snapshot.auto) {
      const autos = (await db.snapshots.where("chapterId").equals(chapterId).sortBy("createdAt"))
        .filter((s) => s.auto);
      const excess = autos.length - MAX_AUTO_SNAPSHOTS;
      if (excess > 0) await db.snapshots.bulkDelete(autos.slice(0, excess).map((s) => s.id));
    }
    return snapshot;
  });
}

/**
 * Takes an auto snapshot if the chapter changed since the newest snapshot and
 * at least `minInterval` ms have passed since it. Returns whether it did.
 */
export async function maybeAutoSnapshot(chapterId: string, minInterval: number, now = new Date()) {
  const chapter = await db.chapters.get(chapterId);
  if (!chapter || chapter.wordCount === 0) return false;
  const latest = await db.snapshots
    .where("[chapterId+createdAt]")
    .between([chapterId, Dexie.minKey], [chapterId, Dexie.maxKey])
    .last();
  if (latest) {
    if (chapter.updatedAt <= latest.createdAt) return false;
    if (now.getTime() - latest.createdAt < minInterval) return false;
  }
  await createSnapshot(chapterId, { auto: true }, now);
  return true;
}

export async function restoreSnapshot(snapshotId: string) {
  const snapshot = await db.snapshots.get(snapshotId);
  if (!snapshot) throw new Error("ไม่พบเวอร์ชันนี้");
  await createSnapshot(snapshot.chapterId, { label: "ก่อนกู้คืน" });
  await saveChapterContent(snapshot.chapterId, snapshot.content);
}

export async function deleteSnapshot(id: string) {
  await db.snapshots.delete(id);
}

// --- Ideas ---

export async function addIdea(text: string, projectId: string | null): Promise<Idea> {
  const now = Date.now();
  const idea: Idea = { id: newId(), projectId, text: text.trim(), pinned: false, createdAt: now, updatedAt: now };
  await db.ideas.add(idea);
  return idea;
}

export async function updateIdea(id: string, patch: Partial<Pick<Idea, "text" | "pinned" | "projectId">>) {
  await db.ideas.update(id, { ...patch, updatedAt: Date.now() });
}

export async function deleteIdea(id: string) {
  await db.ideas.delete(id);
}

// --- Settings ---

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const row = await db.settings.get(key);
  return row ? (row.value as T) : fallback;
}

export async function setSetting(key: string, value: unknown) {
  await db.settings.put({ key, value });
}
