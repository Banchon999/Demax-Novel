import type { Beat } from "@/lib/db/schema";

export type TensionPoint = { order: number; chapterId: string; tension: number | null };

/** Peak planned tension per chapter; null where no beat is placed. */
export function chapterTension(chapters: { id: string; order: number }[], beats: Beat[]): TensionPoint[] {
  const peak = new Map<string, number>();
  for (const b of beats) {
    if (!b.chapterId) continue;
    peak.set(b.chapterId, Math.max(peak.get(b.chapterId) ?? 0, b.tension));
  }
  return [...chapters]
    .sort((a, b) => a.order - b.order)
    .map((c) => ({ order: c.order, chapterId: c.id, tension: peak.get(c.id) ?? null }));
}
