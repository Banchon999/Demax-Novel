import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import {
  createChapter,
  createProject,
  createSnapshot,
  deleteChapter,
  deleteProject,
  maybeAutoSnapshot,
  moveChapter,
  restoreSnapshot,
  saveChapterContent,
} from "@/lib/db/repo";
import { dayKey } from "@/lib/dates";
import type { ChapterContent } from "@/lib/db/schema";

const prose = (text: string): ChapterContent => ({
  kind: "prose",
  doc: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text }] }] },
});

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()));
});

describe("chapters", () => {
  it("numbers new chapters in order with default titles", async () => {
    const p = await createProject({ title: "เรื่องทดสอบ" });
    const c1 = await createChapter(p.id, { format: "prose" });
    const c2 = await createChapter(p.id, { format: "chat" });
    expect([c1.order, c2.order]).toEqual([1, 2]);
    expect(c2.title).toBe("ตอนที่ 2");
    expect(c2.content.kind).toBe("chat");
  });

  it("moves and deletes chapters keeping a contiguous order", async () => {
    const p = await createProject({ title: "x" });
    const a = await createChapter(p.id, { format: "prose", title: "A" });
    const b = await createChapter(p.id, { format: "prose", title: "B" });
    const c = await createChapter(p.id, { format: "prose", title: "C" });
    await moveChapter(c.id, -1);
    let list = await db.chapters.where("projectId").equals(p.id).sortBy("order");
    expect(list.map((x) => x.title)).toEqual(["A", "C", "B"]);
    await deleteChapter(a.id);
    list = await db.chapters.where("projectId").equals(p.id).sortBy("order");
    expect(list.map((x) => [x.title, x.order])).toEqual([["C", 1], ["B", 2]]);
    expect(b.id).toBeTruthy();
  });
});

describe("saveChapterContent", () => {
  it("updates counts and adds net words to today's writing log", async () => {
    const p = await createProject({ title: "x" });
    const ch = await createChapter(p.id, { format: "prose" });
    const now = new Date(2026, 10, 2, 10);
    await saveChapterContent(ch.id, prose("วันนี้อากาศดีมาก"), now);
    await saveChapterContent(ch.id, prose("วันนี้อากาศดี"), now);
    const saved = await db.chapters.get(ch.id);
    expect(saved?.wordCount).toBe(4);
    const day = await db.writingDays.get(`${p.id}:${dayKey(now)}`);
    expect(day?.words).toBe(4);
  });

  it("never lets a day total go below zero", async () => {
    const p = await createProject({ title: "x" });
    const ch = await createChapter(p.id, { format: "prose" });
    await saveChapterContent(ch.id, prose("วันนี้อากาศดีมาก"), new Date(2026, 10, 1));
    const today = new Date(2026, 10, 2);
    await saveChapterContent(ch.id, prose(""), today);
    const day = await db.writingDays.get(`${p.id}:${dayKey(today)}`);
    expect(day?.words ?? 0).toBe(0);
  });
});

describe("snapshots", () => {
  it("auto-snapshots only when the chapter changed and the interval passed", async () => {
    const p = await createProject({ title: "x" });
    const ch = await createChapter(p.id, { format: "prose" });
    const t0 = new Date(2026, 10, 2, 10, 0);
    await saveChapterContent(ch.id, prose("หนึ่ง"), t0);
    expect(await maybeAutoSnapshot(ch.id, 0, t0)).toBe(true);
    expect(await maybeAutoSnapshot(ch.id, 0, t0)).toBe(false);
    const t1 = new Date(2026, 10, 2, 10, 5);
    await saveChapterContent(ch.id, prose("หนึ่ง สอง"), t1);
    expect(await maybeAutoSnapshot(ch.id, 10 * 60_000, t1)).toBe(false);
    const t2 = new Date(2026, 10, 2, 10, 11);
    expect(await maybeAutoSnapshot(ch.id, 10 * 60_000, t2)).toBe(true);
  });

  it("restores a snapshot and keeps the replaced version as a snapshot", async () => {
    const p = await createProject({ title: "x" });
    const ch = await createChapter(p.id, { format: "prose" });
    await saveChapterContent(ch.id, prose("ฉบับแรก"));
    const snap = await createSnapshot(ch.id, { label: "v1" });
    await saveChapterContent(ch.id, prose("ฉบับสอง"));
    await restoreSnapshot(snap.id);
    const restored = await db.chapters.get(ch.id);
    expect(JSON.stringify(restored?.content)).toContain("ฉบับแรก");
    const snaps = await db.snapshots.where("chapterId").equals(ch.id).toArray();
    expect(snaps.some((s) => JSON.stringify(s.content).includes("ฉบับสอง"))).toBe(true);
  });

  it("keeps at most 30 auto snapshots but never prunes manual ones", async () => {
    const p = await createProject({ title: "x" });
    const ch = await createChapter(p.id, { format: "prose" });
    await createSnapshot(ch.id, { label: "สำคัญ" }, new Date(2026, 0, 1));
    for (let i = 0; i < 35; i++) {
      await createSnapshot(ch.id, { auto: true }, new Date(2026, 0, 2, 0, i));
    }
    const snaps = await db.snapshots.where("chapterId").equals(ch.id).toArray();
    expect(snaps.filter((s) => s.auto)).toHaveLength(30);
    expect(snaps.filter((s) => !s.auto)).toHaveLength(1);
  });
});

describe("deleteProject", () => {
  it("removes the project and everything that belongs to it", async () => {
    const p = await createProject({ title: "x" });
    const ch = await createChapter(p.id, { format: "prose" });
    await saveChapterContent(ch.id, prose("ข้อความ"));
    await createSnapshot(ch.id);
    await db.ideas.add({ id: "i1", projectId: p.id, text: "ไอเดีย", pinned: false, createdAt: 1, updatedAt: 1 });
    await deleteProject(p.id);
    expect(await db.projects.count()).toBe(0);
    expect(await db.chapters.count()).toBe(0);
    expect(await db.snapshots.count()).toBe(0);
    expect(await db.ideas.count()).toBe(0);
    expect(await db.writingDays.count()).toBe(0);
  });
});
