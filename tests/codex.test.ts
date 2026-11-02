import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import {
  addLink,
  addProgression,
  createEntity,
  createEvent,
  deleteEntity,
  deleteEntityType,
  ensureCodexSeeded,
  updateEntity,
} from "@/lib/db/codex";
import { createChapter, createProject, deleteChapter, saveChapterContent } from "@/lib/db/repo";
import { appearances, absenceStreak } from "@/lib/codex/appearances";
import { buildTerms, findMentions } from "@/lib/codex/mentions";
import { stateAt } from "@/lib/codex/state";
import type { ChapterContent, Entity } from "@/lib/db/schema";

const prose = (text: string): ChapterContent => ({
  kind: "prose",
  doc: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text }] }] },
});

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()));
});

const entity = (over: Partial<Entity>): Entity => ({
  id: "e",
  projectId: "p",
  typeId: "t",
  name: "",
  aliases: [],
  tags: [],
  fields: {},
  notes: "",
  progressions: [],
  createdAt: 0,
  updatedAt: 0,
  ...over,
});

describe("default codex types", () => {
  it("are created with a new project, once", async () => {
    const p = await createProject({ title: "x" });
    const types = await db.entityTypes.where("projectId").equals(p.id).sortBy("order");
    expect(types.map((t) => t.name)).toEqual(["ตัวละคร", "สถานที่", "ไอเทม", "ฝ่าย/องค์กร", "ระบบ/พลัง"]);
    expect(types[0].fields.length).toBeGreaterThan(3);
    await Promise.all(types.map((t) => deleteEntityType(t.id)));
    await ensureCodexSeeded(p.id);
    expect(await db.entityTypes.where("projectId").equals(p.id).count()).toBe(0);
  });
});

describe("mentions", () => {
  const terms = buildTerms([
    entity({ id: "a", name: "ไลลา", aliases: ["ไล"] }),
    entity({ id: "b", name: "ไลลานี" }),
    entity({ id: "c", name: "หอคอยเงา", aliases: ["ห"] }),
  ]);

  it("finds names and aliases inside unspaced Thai text, longest first", () => {
    const found = findMentions("ไลลานีเดินไปหาไลลาที่หอคอยเงา ไลยิ้ม", terms);
    expect(found.map((m) => m.entityId)).toEqual(["b", "a", "c", "a"]);
    expect(found[0]).toMatchObject({ from: 0, to: 6 });
  });

  it("ignores one-letter terms that would match everywhere", () => {
    expect(terms.some((t) => t.term === "ห")).toBe(false);
  });

  it("matches latin names case-insensitively", () => {
    const t = buildTerms([entity({ id: "x", name: "Rain" })]);
    expect(findMentions("rain and RAIN", t)).toHaveLength(2);
  });
});

describe("stateAt", () => {
  it("applies progressions up to the chosen chapter", () => {
    const e = entity({
      fields: { level: "1", rank: "ทหาร" },
      progressions: [
        { id: "1", chapterId: "c3", fieldId: "level", value: "5", note: "", createdAt: 1 },
        { id: "2", chapterId: "c7", fieldId: "level", value: "20", note: "ปลดผนึก", createdAt: 2 },
        { id: "3", chapterId: "c5", fieldId: "rank", value: "แม่ทัพ", note: "", createdAt: 3 },
      ],
    });
    const order = new Map([["c3", 3], ["c5", 5], ["c7", 7]]);
    expect(stateAt(e, order, 1).level.value).toBe("1");
    const at6 = stateAt(e, order, 6);
    expect([at6.level.value, at6.level.sinceOrder, at6.rank.value]).toEqual(["5", 3, "แม่ทัพ"]);
    expect(stateAt(e, order, 99).level).toMatchObject({ value: "20", note: "ปลดผนึก" });
  });
});

describe("appearances", () => {
  it("lists chapter orders where an entity is mentioned and how long it has been absent", () => {
    const e = entity({ id: "a", name: "ไลลา" });
    const chapters = [1, 2, 3, 4, 5].map((order) => ({
      order,
      content: prose(order === 2 || order === 3 ? "ไลลาเดินมา" : "ฝนตก"),
    }));
    const map = appearances(chapters, [e]);
    expect(map.get("a")).toEqual([2, 3]);
    expect(absenceStreak(map.get("a") ?? [], 5)).toBe(2);
  });
});

describe("codex repo", () => {
  it("deleting an entity removes its links and event references", async () => {
    const p = await createProject({ title: "x" });
    const [type] = await db.entityTypes.where("projectId").equals(p.id).sortBy("order");
    const a = await createEntity(p.id, type.id, "ไลลา");
    const b = await createEntity(p.id, type.id, "เรน");
    await addLink(p.id, a.id, b.id, "พี่น้อง");
    const ev = await createEvent(p.id, { title: "สงคราม", entityIds: [a.id, b.id] });
    await deleteEntity(a.id);
    expect(await db.links.count()).toBe(0);
    expect((await db.events.get(ev.id))?.entityIds).toEqual([b.id]);
  });

  it("deleting a chapter drops progressions recorded at it", async () => {
    const p = await createProject({ title: "x" });
    const [type] = await db.entityTypes.where("projectId").equals(p.id).sortBy("order");
    const a = await createEntity(p.id, type.id, "ไลลา");
    const ch = await createChapter(p.id, { format: "prose" });
    await saveChapterContent(ch.id, prose("ไลลา"));
    await addProgression(a.id, { chapterId: ch.id, fieldId: type.fields[0].id, value: "ตัวร้าย", note: "" });
    await deleteChapter(ch.id);
    expect((await db.entities.get(a.id))?.progressions).toEqual([]);
  });

  it("updates aliases and tags with trimming and de-duplication", async () => {
    const p = await createProject({ title: "x" });
    const [type] = await db.entityTypes.where("projectId").equals(p.id).sortBy("order");
    const a = await createEntity(p.id, type.id, "  ไลลา ");
    await updateEntity(a.id, { aliases: [" ไล", "ไล", ""], tags: ["เวทมนตร์", " เวทมนตร์ "] });
    const saved = await db.entities.get(a.id);
    expect([saved?.name, saved?.aliases, saved?.tags]).toEqual(["ไลลา", ["ไล"], ["เวทมนตร์"]]);
  });
});
