import { TEMPLATES, type TemplateKey } from "@/lib/plot/templates";
import { db } from "./index";
import { newId } from "./id";
import type { Arc, Beat, PlotThread } from "./schema";

export const ARC_COLORS = ["#8b5cf6", "#ec4899", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444"];

// --- Arcs ---

export function projectArcs(projectId: string) {
  return db.arcs.where("projectId").equals(projectId).sortBy("order");
}

export async function createArc(projectId: string, input: { title: string; summary?: string; color?: string }) {
  const count = await db.arcs.where("projectId").equals(projectId).count();
  const now = Date.now();
  const arc: Arc = {
    id: newId(),
    projectId,
    title: input.title.trim() || `ภาคที่ ${count + 1}`,
    summary: input.summary?.trim() ?? "",
    color: input.color ?? ARC_COLORS[count % ARC_COLORS.length],
    order: count + 1,
    createdAt: now,
    updatedAt: now,
  };
  await db.arcs.add(arc);
  return arc;
}

export async function updateArc(id: string, patch: Partial<Pick<Arc, "title" | "summary" | "color">>) {
  await db.arcs.update(id, { ...patch, updatedAt: Date.now() });
}

export async function deleteArc(id: string) {
  await db.transaction("rw", db.arcs, db.beats, async () => {
    const arc = await db.arcs.get(id);
    if (!arc) return;
    await db.beats.where("arcId").equals(id).delete();
    await db.arcs.delete(id);
    const rest = await projectArcs(arc.projectId);
    await Promise.all(rest.map((a, i) => (a.order === i + 1 ? null : db.arcs.update(a.id, { order: i + 1 }))));
  });
}

export async function moveArc(id: string, dir: -1 | 1) {
  await db.transaction("rw", db.arcs, async () => {
    const arc = await db.arcs.get(id);
    if (!arc) return;
    const list = await projectArcs(arc.projectId);
    const other = list.find((a) => a.order === arc.order + dir);
    if (!other) return;
    await db.arcs.update(arc.id, { order: other.order });
    await db.arcs.update(other.id, { order: arc.order });
  });
}

// --- Beats ---

const arcBeats = (arcId: string) => db.beats.where("arcId").equals(arcId).sortBy("order");

export async function createBeat(
  arcId: string,
  input: Partial<Pick<Beat, "description" | "chapterId" | "tension">> & { title: string },
) {
  const arc = await db.arcs.get(arcId);
  if (!arc) throw new Error("ไม่พบภาคนี้");
  const count = await db.beats.where("arcId").equals(arcId).count();
  const beat: Beat = {
    id: newId(),
    projectId: arc.projectId,
    arcId,
    title: input.title.trim() || "จังหวะใหม่",
    description: input.description ?? "",
    order: count + 1,
    chapterId: input.chapterId ?? null,
    tension: Math.min(10, Math.max(1, input.tension ?? 5)),
    done: false,
  };
  await db.beats.add(beat);
  return beat;
}

export async function updateBeat(id: string, patch: Partial<Omit<Beat, "id" | "projectId" | "arcId" | "order">>) {
  await db.beats.update(id, patch);
}

export async function deleteBeat(id: string) {
  await db.transaction("rw", db.beats, async () => {
    const beat = await db.beats.get(id);
    if (!beat) return;
    await db.beats.delete(id);
    const rest = await arcBeats(beat.arcId);
    await Promise.all(rest.map((b, i) => (b.order === i + 1 ? null : db.beats.update(b.id, { order: i + 1 }))));
  });
}

export async function moveBeat(id: string, dir: -1 | 1) {
  await db.transaction("rw", db.beats, async () => {
    const beat = await db.beats.get(id);
    if (!beat) return;
    const other = (await arcBeats(beat.arcId)).find((b) => b.order === beat.order + dir);
    if (!other) return;
    await db.beats.update(beat.id, { order: other.order });
    await db.beats.update(other.id, { order: beat.order });
  });
}

/** Appends a structure template's beats after the arc's existing ones. */
export async function applyTemplate(arcId: string, key: TemplateKey) {
  await db.transaction("rw", db.arcs, db.beats, async () => {
    const arc = await db.arcs.get(arcId);
    if (!arc) return;
    const start = await db.beats.where("arcId").equals(arcId).count();
    await db.beats.bulkAdd(
      TEMPLATES[key].beats.map((t, i) => ({
        id: newId(),
        projectId: arc.projectId,
        arcId,
        title: t.title,
        description: t.description,
        order: start + i + 1,
        chapterId: null,
        tension: t.tension,
        done: false,
      })),
    );
  });
}

// --- Threads (setups & payoffs) ---

export async function createThread(
  projectId: string,
  input: Partial<Omit<PlotThread, "id" | "projectId" | "createdAt" | "updatedAt">> & { title: string },
) {
  const now = Date.now();
  const thread: PlotThread = {
    id: newId(),
    projectId,
    title: input.title.trim() || "ปมใหม่",
    description: input.description ?? "",
    plantChapterId: input.plantChapterId ?? null,
    payoffChapterId: input.payoffChapterId ?? null,
    status: input.status ?? "open",
    entityIds: input.entityIds ?? [],
    createdAt: now,
    updatedAt: now,
  };
  await db.threads.add(thread);
  return thread;
}

export async function updateThread(id: string, patch: Partial<Omit<PlotThread, "id" | "projectId">>) {
  await db.threads.update(id, { ...patch, updatedAt: Date.now() });
}

export async function deleteThread(id: string) {
  await db.threads.delete(id);
}
