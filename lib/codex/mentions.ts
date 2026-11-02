import type { Entity } from "@/lib/db/schema";

export type Term = { term: string; key: string; entityId: string };
export type Mention = { from: number; to: number; entityId: string; term: string };

/** Shorter terms would light up inside ordinary words. */
const MIN_TERM_LENGTH = 2;

/** Names and aliases, longest first so "ไลลานี" wins over "ไลลา". */
export function buildTerms(entities: Pick<Entity, "id" | "name" | "aliases">[]): Term[] {
  const terms: Term[] = [];
  for (const e of entities) {
    for (const raw of [e.name, ...e.aliases]) {
      const term = raw.trim();
      if ([...term].length < MIN_TERM_LENGTH) continue;
      terms.push({ term, key: term.toLowerCase(), entityId: e.id });
    }
  }
  return terms.sort((a, b) => b.key.length - a.key.length);
}

/**
 * Plain substring search (Thai has no spaces to anchor word boundaries),
 * non-overlapping, preferring the longest term at each position.
 */
export function findMentions(text: string, terms: Term[]): Mention[] {
  if (!terms.length || !text) return [];
  const hay = text.toLowerCase();
  const found: Mention[] = [];
  const taken = new Uint8Array(hay.length);
  for (const t of terms) {
    let i = hay.indexOf(t.key);
    while (i !== -1) {
      const end = i + t.key.length;
      let free = true;
      for (let k = i; k < end; k++) if (taken[k]) { free = false; break; }
      if (free) {
        taken.fill(1, i, end);
        found.push({ from: i, to: end, entityId: t.entityId, term: t.term });
      }
      i = hay.indexOf(t.key, free ? end : i + 1);
    }
  }
  return found.sort((a, b) => a.from - b.from);
}

export function mentionedIds(text: string, terms: Term[]): Set<string> {
  return new Set(findMentions(text, terms).map((m) => m.entityId));
}
