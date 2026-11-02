import type { ChapterContent, Entity } from "@/lib/db/schema";
import { chapterPlainText } from "@/lib/text/plain-text";
import { buildTerms, mentionedIds } from "./mentions";

/** Chapter orders (ascending) in which each entity is mentioned. */
export function appearances(
  chapters: { order: number; content: ChapterContent }[],
  entities: Pick<Entity, "id" | "name" | "aliases">[],
): Map<string, number[]> {
  const terms = buildTerms(entities);
  const map = new Map<string, number[]>(entities.map((e) => [e.id, []]));
  for (const c of [...chapters].sort((a, b) => a.order - b.order)) {
    for (const id of mentionedIds(chapterPlainText(c.content), terms)) map.get(id)?.push(c.order);
  }
  return map;
}

/** Chapters since the last appearance (0 if in the latest chapter). */
export function absenceStreak(orders: number[], lastOrder: number): number {
  if (!orders.length) return lastOrder;
  return lastOrder - orders[orders.length - 1];
}
