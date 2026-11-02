import { buildTerms, mentionedIds } from "@/lib/codex/mentions";
import { stateAt } from "@/lib/codex/state";
import type {
  Arc,
  Beat,
  Chapter,
  Entity,
  EntityLink,
  EntityType,
  PlotThread,
  Project,
  TimelineEvent,
} from "@/lib/db/schema";
import { chapterPlainText } from "@/lib/text/plain-text";

export type StoryData = {
  project: Project;
  chapters: Chapter[];
  types: EntityType[];
  entities: Entity[];
  links: EntityLink[];
  arcs: Arc[];
  beats: Beat[];
  threads: PlotThread[];
  events: TimelineEvent[];
};

/** Character budget for the whole context block (~25k tokens of Thai). */
export const CONTEXT_BUDGET = 60_000;
const FOCUS_TEXT_BUDGET = 24_000;
const PREVIOUS_TAIL = 2_500;

const clip = (s: string, n: number) => (s.length <= n ? s : `${s.slice(0, n)}…`);
/** Keeps the end of long text: the latest part matters most for continuing. */
const tail = (s: string, n: number) => (s.length <= n ? s : `…${s.slice(-n)}`);

/**
 * Story knowledge for the AI, in Thai: synopsis, structure, open threads,
 * the relevant codex entries *as of the focus chapter*, and the text.
 * With a focus chapter, only entities mentioned there (or just before)
 * plus their direct relations are included, keeping prompts small.
 */
export function buildContext(data: StoryData, focusChapterId: string | null, budget = CONTEXT_BUDGET): string {
  const chapters = [...data.chapters].sort((a, b) => a.order - b.order);
  const focus = focusChapterId ? chapters.find((c) => c.id === focusChapterId) : undefined;
  const prev = focus ? chapters.find((c) => c.order === focus.order - 1) : undefined;
  const atOrder = focus?.order ?? chapters.length;
  const order = new Map(chapters.map((c) => [c.id, c.order]));
  const typeById = new Map(data.types.map((t) => [t.id, t]));
  const entityById = new Map(data.entities.map((e) => [e.id, e]));
  const sections: string[] = [];

  sections.push(
    `## ข้อมูลเรื่อง\nชื่อเรื่อง: ${data.project.title}\n${data.project.synopsis ? `เรื่องย่อ: ${data.project.synopsis}\n` : ""}จำนวนตอน: ${chapters.length}`,
  );

  if (chapters.length) {
    sections.push(`## สารบัญ\n${chapters.map((c) => `${c.order}. ${c.title}${c.status === "done" ? " (เสร็จ)" : ""}`).join("\n")}`);
  }

  if (data.arcs.length) {
    const lines = data.arcs
      .sort((a, b) => a.order - b.order)
      .map((arc) => {
        const beats = data.beats
          .filter((b) => b.arcId === arc.id)
          .sort((a, b) => a.order - b.order)
          .map((b) => {
            const at = b.chapterId ? ` [ตอน ${order.get(b.chapterId)}]` : "";
            return `  - ${b.done ? "✓" : "○"} ${b.title}${at} (ตึงเครียด ${b.tension}/10)${b.description ? `: ${clip(b.description, 160)}` : ""}`;
          });
        return [`### ${arc.title}${arc.summary ? ` — ${clip(arc.summary, 300)}` : ""}`, ...beats].join("\n");
      });
    sections.push(`## โครงเรื่อง (ภาคและจังหวะ)\n${lines.join("\n")}`);
  }

  const open = data.threads.filter((t) => t.status === "open");
  if (open.length) {
    sections.push(
      `## ปมที่ยังไม่เฉลย\n${open
        .map((t) => {
          const plant = t.plantChapterId ? `ปูตอน ${order.get(t.plantChapterId)}` : "ยังไม่ระบุตอนที่ปู";
          const payoff = t.payoffChapterId ? `, วางแผนเฉลยตอน ${order.get(t.payoffChapterId)}` : "";
          return `- ${t.title} (${plant}${payoff})${t.description ? `: ${clip(t.description, 200)}` : ""}`;
        })
        .join("\n")}`,
    );
  }

  // Which codex entries matter here.
  let relevant = data.entities;
  if (focus) {
    const terms = buildTerms(data.entities);
    const ids = mentionedIds(chapterPlainText(focus.content), terms);
    if (prev) for (const id of mentionedIds(tail(chapterPlainText(prev.content), PREVIOUS_TAIL), terms)) ids.add(id);
    for (const l of data.links) {
      if (ids.has(l.fromId)) ids.add(l.toId);
      else if (ids.has(l.toId)) ids.add(l.fromId);
    }
    relevant = data.entities.filter((e) => ids.has(e.id));
  }
  if (relevant.length) {
    const lines = relevant.map((e) => {
      const type = typeById.get(e.typeId);
      const state = stateAt(e, order, atOrder);
      const fields = (type?.fields ?? [])
        .filter((f) => state[f.id]?.value)
        .map((f) => `${f.label}: ${clip(state[f.id].value, 240)}${state[f.id].sinceOrder ? ` (ตั้งแต่ตอน ${state[f.id].sinceOrder})` : ""}`);
      const rel = data.links
        .filter((l) => l.fromId === e.id)
        .map((l) => `${l.label || "เกี่ยวข้องกับ"} ${entityById.get(l.toId)?.name ?? "?"}`);
      const head = `- ${e.name} [${type?.name ?? "ข้อมูล"}]${e.aliases.length ? ` (ชื่ออื่น: ${e.aliases.join(", ")})` : ""}${e.tags.length ? ` #${e.tags.join(" #")}` : ""}`;
      const body = [...fields, ...(rel.length ? [`ความสัมพันธ์: เป็น${rel.join(", เป็น")}`] : []), ...(e.notes ? [`โน้ต: ${clip(e.notes, 300)}`] : [])];
      return [head, ...body.map((b) => `  ${b}`)].join("\n");
    });
    sections.push(
      `## ข้อมูลใน Codex${focus ? ` ที่เกี่ยวข้องกับตอนที่ ${focus.order} (สถานะ ณ ตอนนั้น)` : ""}\n${lines.join("\n")}`,
    );
  }

  if (data.events.length) {
    const evs = [...data.events].sort((a, b) => a.sortKey - b.sortKey).slice(0, 40);
    sections.push(`## ไทม์ไลน์ของโลก\n${evs.map((e) => `- ${e.when || "?"}: ${e.title}${e.notes ? ` — ${clip(e.notes, 160)}` : ""}`).join("\n")}`);
  }

  if (prev) sections.push(`## ท้ายตอนก่อนหน้า (ตอนที่ ${prev.order}: ${prev.title})\n${tail(chapterPlainText(prev.content), PREVIOUS_TAIL)}`);
  if (focus) {
    sections.push(`## เนื้อหาตอนที่ ${focus.order}: ${focus.title}\n${tail(chapterPlainText(focus.content), FOCUS_TEXT_BUDGET) || "(ยังว่าง)"}`);
  }

  // Trim from the middle sections if over budget; the story text and the
  // project header are the last things to go.
  let text = sections.join("\n\n");
  while (text.length > budget && sections.length > 2) {
    sections.splice(1, 1);
    text = sections.join("\n\n");
  }
  return clip(text, budget);
}
