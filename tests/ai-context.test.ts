import { describe, expect, it } from "vitest";
import { buildContext, type StoryData } from "@/lib/ai/context";
import { AI_MODES, modeByKey, systemPrompt } from "@/lib/ai/modes";
import type { ChapterContent } from "@/lib/db/schema";

const prose = (text: string): ChapterContent => ({
  kind: "prose",
  doc: { type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text }] }] },
});

function story(): StoryData {
  const ch = (id: string, order: number, text: string) => ({
    id, projectId: "p", order, title: `ตอน${order}`, format: "prose" as const, content: prose(text),
    wordCount: 0, charCount: 0, status: "draft" as const, createdAt: 0, updatedAt: 0,
  });
  const ent = (id: string, name: string, fields: Record<string, string> = {}) => ({
    id, projectId: "p", typeId: "t", name, aliases: [], tags: [], fields, notes: "", progressions: [], createdAt: 0, updatedAt: 0,
  });
  return {
    project: { id: "p", title: "ราชันย์แห่งเงา", synopsis: "เด็กหนุ่มได้พลังเงา", cover: ["#000", "#000"], defaultFormat: "prose", dailyGoal: 0, createdAt: 0, updatedAt: 0 },
    chapters: [ch("c1", 1, "ไลลาพบเรนที่ตลาด"), ch("c2", 2, "ไลลาเดินเข้าหอคอย")],
    types: [{ id: "t", projectId: "p", name: "ตัวละคร", icon: "👤", color: "#fff", order: 1, fields: [{ id: "role", label: "บทบาท", kind: "text" }] }],
    entities: [
      { ...ent("a", "ไลลา", { role: "ตัวเอก" }), progressions: [{ id: "x", chapterId: "c2", fieldId: "role", value: "ตัวร้าย", note: "", createdAt: 1 }] },
      ent("b", "เรน"),
      ent("z", "กษัตริย์ไกลโพ้น"),
      ent("m", "แม่ของไลลา"),
    ],
    links: [{ id: "l", projectId: "p", fromId: "m", toId: "a", label: "แม่" }],
    arcs: [], beats: [],
    threads: [{ id: "t1", projectId: "p", title: "ดาบหัก", description: "", plantChapterId: "c1", payoffChapterId: null, status: "open", entityIds: [], createdAt: 0, updatedAt: 0 }],
    events: [],
  };
}

describe("buildContext", () => {
  it("includes only entities relevant to the focus chapter, with state as of it", () => {
    const ctx = buildContext(story(), "c1");
    expect(ctx).toContain("ไลลา");
    expect(ctx).toContain("บทบาท: ตัวเอก");
    expect(ctx).not.toContain("ตัวร้าย");
    expect(ctx).toContain("แม่ของไลลา"); // pulled in by a relationship
    expect(ctx).not.toContain("กษัตริย์ไกลโพ้น");
    expect(ctx).toContain("ดาบหัก (ปูตอน 1)");
  });

  it("shows the later state and previous chapter tail for chapter 2", () => {
    const ctx = buildContext(story(), "c2");
    expect(ctx).toContain("ตัวร้าย (ตั้งแต่ตอน 2)");
    expect(ctx).toContain("ท้ายตอนก่อนหน้า");
    expect(ctx).toContain("ไลลาเดินเข้าหอคอย");
  });

  it("without a focus chapter includes the whole codex and respects the budget", () => {
    const ctx = buildContext(story(), null);
    expect(ctx).toContain("กษัตริย์ไกลโพ้น");
    expect(buildContext(story(), null, 200).length).toBeLessThanOrEqual(201);
  });
});

describe("modes", () => {
  it("cover every assistant job and embed the context", () => {
    expect(AI_MODES.map((m) => m.key)).toEqual(["continue", "futures", "character", "world", "economy", "analyze", "review", "free"]);
    expect(modeByKey("nope").key).toBe("free");
    expect(systemPrompt(modeByKey("review"), "CTX")).toContain("CTX");
  });
});
