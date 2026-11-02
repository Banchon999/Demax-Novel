import type { Entity } from "@/lib/db/schema";

export type FieldState = {
  value: string;
  /** Chapter order the value took effect at; undefined = base value. */
  sinceOrder?: number;
  note?: string;
};

/**
 * An entity's fields as of chapter `atOrder`: base values overridden by
 * progressions recorded at that chapter or earlier, in story order.
 */
export function stateAt(
  entity: Pick<Entity, "fields" | "progressions">,
  chapterOrder: Map<string, number>,
  atOrder: number,
): Record<string, FieldState> {
  const state: Record<string, FieldState> = {};
  for (const [id, value] of Object.entries(entity.fields)) state[id] = { value };
  const applicable = entity.progressions
    .map((p) => ({ p, order: chapterOrder.get(p.chapterId) }))
    .filter((x): x is { p: (typeof x)["p"]; order: number } => x.order !== undefined && x.order <= atOrder)
    .sort((a, b) => a.order - b.order || a.p.createdAt - b.p.createdAt);
  for (const { p, order } of applicable) {
    state[p.fieldId] = { value: p.value, sinceOrder: order, note: p.note || undefined };
  }
  return state;
}
