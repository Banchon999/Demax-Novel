import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { applyTemplate, createArc, createBeat, createThread, deleteArc, moveBeat } from "@/lib/db/plot";
import { createChapter, createProject } from "@/lib/db/repo";
import { plotInsights } from "@/lib/plot/insights";
import { chapterTension } from "@/lib/plot/tension";
import { TEMPLATES } from "@/lib/plot/templates";
import type { Arc, Beat, PlotThread } from "@/lib/db/schema";

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()));
});

const beat = (over: Partial<Beat>): Beat => ({
  id: Math.random().toString(),
  projectId: "p",
  arcId: "a",
  title: "",
  description: "",
  order: 1,
  chapterId: null,
  tension: 5,
  done: false,
  ...over,
});
const chapters = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `c${i + 1}`, order: i + 1 }));

describe("templates", () => {
  it("ship the classic structures with tension values in range", () => {
    expect(Object.keys(TEMPLATES)).toEqual(["savethecat", "hero", "threeact", "kishotenketsu", "webnovel"]);
    expect(TEMPLATES.savethecat.beats).toHaveLength(15);
    expect(TEMPLATES.hero.beats).toHaveLength(12);
    for (const t of Object.values(TEMPLATES)) {
      for (const b of t.beats) {
        expect(b.tension).toBeGreaterThanOrEqual(1);
        expect(b.tension).toBeLessThanOrEqual(10);
      }
    }
  });
});

describe("chapterTension", () => {
  it("takes the peak beat per chapter and leaves unplanned chapters empty", () => {
    const t = chapterTension(chapters(3), [
      beat({ chapterId: "c1", tension: 3 }),
      beat({ chapterId: "c1", tension: 7 }),
      beat({ chapterId: "c3", tension: 9 }),
    ]);
    expect(t).toEqual([
      { order: 1, chapterId: "c1", tension: 7 },
      { order: 2, chapterId: "c2", tension: null },
      { order: 3, chapterId: "c3", tension: 9 },
    ]);
  });
});

describe("plotInsights", () => {
  const arc: Arc = { id: "a", projectId: "p", title: "ภาคหอคอย", summary: "", color: "#000", order: 1, createdAt: 0, updatedAt: 0 };
  const thread = (over: Partial<PlotThread>): PlotThread => ({
    id: "t",
    projectId: "p",
    title: "ดาบหัก",
    description: "",
    plantChapterId: "c1",
    payoffChapterId: null,
    status: "open",
    entityIds: [],
    createdAt: 0,
    updatedAt: 0,
    ...over,
  });

  it("flags flat stretches, missing climaxes and long-open threads", () => {
    const chs = chapters(20);
    const beats = [1, 2, 3, 4].map((n) => beat({ chapterId: `c${n}`, tension: 2 }));
    const kinds = plotInsights({ chapters: chs, arcs: [arc], beats, threads: [thread({})] }).map((i) => i.kind);
    expect(kinds).toContain("flat");
    expect(kinds).toContain("no-climax");
    expect(kinds).toContain("stale-thread");
  });

  it("flags a payoff placed before its setup", () => {
    const res = plotInsights({
      chapters: chapters(5),
      arcs: [],
      beats: [],
      threads: [thread({ plantChapterId: "c4", payoffChapterId: "c2", status: "paid" })],
    });
    expect(res.map((i) => i.kind)).toEqual(["payoff-before-plant"]);
  });

  it("is quiet for a healthy plan", () => {
    const beats = [beat({ chapterId: "c1", tension: 4 }), beat({ chapterId: "c2", tension: 9 })];
    expect(plotInsights({ chapters: chapters(2), arcs: [arc], beats, threads: [] })).toEqual([]);
  });
});

describe("plot repo", () => {
  it("applies a template after existing beats and cascades on arc delete", async () => {
    const p = await createProject({ title: "x" });
    const arc = await createArc(p.id, { title: "ภาคแรก" });
    await createBeat(arc.id, { title: "ฉากเปิด" });
    await applyTemplate(arc.id, "kishotenketsu");
    const beats = await db.beats.where("arcId").equals(arc.id).sortBy("order");
    expect(beats.map((b) => b.order)).toEqual([1, 2, 3, 4, 5]);
    expect(beats[1].title).toBe(TEMPLATES.kishotenketsu.beats[0].title);
    await moveBeat(beats[4].id, -1);
    const moved = await db.beats.where("arcId").equals(arc.id).sortBy("order");
    expect(moved[3].id).toBe(beats[4].id);
    await deleteArc(arc.id);
    expect(await db.beats.count()).toBe(0);
  });

  it("deleting a chapter unlinks beats and threads", async () => {
    const p = await createProject({ title: "x" });
    const ch = await createChapter(p.id, { format: "prose" });
    const arc = await createArc(p.id, { title: "a" });
    const b = await createBeat(arc.id, { title: "b", chapterId: ch.id });
    const t = await createThread(p.id, { title: "ปม", plantChapterId: ch.id });
    const { deleteChapter } = await import("@/lib/db/repo");
    await deleteChapter(ch.id);
    expect((await db.beats.get(b.id))?.chapterId).toBeNull();
    expect((await db.threads.get(t.id))?.plantChapterId).toBeNull();
  });
});
