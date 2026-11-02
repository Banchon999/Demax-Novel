import type { Arc, Beat, PlotThread } from "@/lib/db/schema";
import { chapterTension } from "./tension";

export type InsightKind = "flat" | "no-climax" | "stale-thread" | "payoff-before-plant" | "unplanned";
export type Insight = { kind: InsightKind; message: string };

/** Planned tension at or below this for FLAT_RUN chapters reads as a sag. */
const FLAT_TENSION = 3;
const FLAT_RUN = 3;
/** Beats of at least this tension count as an arc's climax. */
const CLIMAX = 8;
/** Open setups older than this many chapters deserve a reminder. */
const STALE_AFTER = 15;
/** Written chapters in a row with no beat placed. */
const UNPLANNED_RUN = 5;

/**
 * Rule-based nudges, not rules: each one points at something a writer
 * usually wants to know, and is free to ignore.
 */
export function plotInsights(input: {
  chapters: { id: string; order: number }[];
  arcs: Arc[];
  beats: Beat[];
  threads: PlotThread[];
}): Insight[] {
  const out: Insight[] = [];
  const order = new Map(input.chapters.map((c) => [c.id, c.order]));
  const last = Math.max(0, ...input.chapters.map((c) => c.order));
  const points = chapterTension(input.chapters, input.beats);

  const runs = (match: (t: number | null) => boolean, min: number) => {
    const found: [number, number][] = [];
    let start: number | null = null;
    points.forEach((p, i) => {
      if (match(p.tension)) start ??= p.order;
      if (start !== null && (!match(p.tension) || i === points.length - 1)) {
        const end = match(p.tension) ? p.order : points[i - 1].order;
        if (end - start + 1 >= min) found.push([start, end]);
        start = null;
      }
    });
    return found;
  };

  for (const [a, b] of runs((t) => t !== null && t <= FLAT_TENSION, FLAT_RUN)) {
    out.push({ kind: "flat", message: `ตอนที่ ${a}–${b} จังหวะเรื่องเนือยต่อกัน ${b - a + 1} ตอน ลองแทรกปม ความขัดแย้ง หรือตะขอท้ายตอน` });
  }
  if (input.beats.some((b) => b.chapterId)) {
    for (const [a, b] of runs((t) => t === null, UNPLANNED_RUN)) {
      out.push({ kind: "unplanned", message: `ตอนที่ ${a}–${b} ยังไม่ได้วาง beat ไว้เลย` });
    }
  }
  for (const arc of input.arcs) {
    const mine = input.beats.filter((b) => b.arcId === arc.id);
    if (mine.length && !mine.some((b) => b.tension >= CLIMAX)) {
      out.push({ kind: "no-climax", message: `ภาค “${arc.title}” ยังไม่มีจุดพีค (beat ที่ความตึงเครียด ${CLIMAX}+)` });
    }
  }
  for (const t of input.threads) {
    const plant = t.plantChapterId ? order.get(t.plantChapterId) : undefined;
    const payoff = t.payoffChapterId ? order.get(t.payoffChapterId) : undefined;
    if (plant !== undefined && payoff !== undefined && payoff < plant) {
      out.push({ kind: "payoff-before-plant", message: `ปม “${t.title}” เฉลยตอนที่ ${payoff} ก่อนปูตอนที่ ${plant}` });
    } else if (t.status === "open" && plant !== undefined && last - plant >= STALE_AFTER) {
      out.push({ kind: "stale-thread", message: `ปม “${t.title}” ปูไว้ตั้งแต่ตอนที่ ${plant} (${last - plant} ตอนก่อน) ยังไม่เฉลย` });
    }
  }
  return out;
}
