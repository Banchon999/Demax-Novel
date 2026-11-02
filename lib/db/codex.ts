import { db } from "./index";
import { newId } from "./id";
import type { Entity, EntityLink, EntityType, FieldDef, FieldKind, Progression, TimelineEvent } from "./schema";

const f = (label: string, kind: FieldKind = "text", options?: string[]): FieldDef => ({
  id: newId(),
  label,
  kind,
  ...(options ? { options } : {}),
});

/** Starter types a web-novel writer needs; all editable or deletable. */
function defaultTypes(projectId: string): EntityType[] {
  const t = (order: number, name: string, icon: string, color: string, fields: FieldDef[]): EntityType => ({
    id: newId(),
    projectId,
    name,
    icon,
    color,
    fields,
    order,
  });
  return [
    t(1, "ตัวละคร", "👤", "#a78bfa", [
      f("บทบาท", "select", ["ตัวเอก", "นางเอก/พระเอก", "ตัวร้าย", "ตัวรอง", "ตัวประกอบ"]),
      f("อายุ"),
      f("เพศ"),
      f("รูปลักษณ์", "longtext"),
      f("นิสัย", "longtext"),
      f("ความสามารถ/พลัง", "longtext"),
      f("เป้าหมาย", "longtext"),
      f("ปม/ความลับ", "longtext"),
      f("วิธีพูด/คำติดปาก"),
    ]),
    t(2, "สถานที่", "🏰", "#38bdf8", [
      f("ประเภท"),
      f("ภูมิภาค"),
      f("ประชากร", "number"),
      f("ลักษณะ", "longtext"),
      f("ความสำคัญต่อเรื่อง", "longtext"),
    ]),
    t(3, "ไอเทม", "🗡️", "#fbbf24", [
      f("ประเภท"),
      f("ความหายาก", "select", ["ธรรมดา", "หายาก", "ตำนาน", "เทพ"]),
      f("ความสามารถ", "longtext"),
      f("เจ้าของ"),
      f("ที่มา", "longtext"),
    ]),
    t(4, "ฝ่าย/องค์กร", "🛡️", "#f472b6", [
      f("ประเภท"),
      f("ผู้นำ"),
      f("สมาชิก/ขนาด"),
      f("อุดมการณ์", "longtext"),
    ]),
    t(5, "ระบบ/พลัง", "✨", "#34d399", [
      f("กฎ", "longtext"),
      f("ข้อจำกัด/สิ่งที่ต้องแลก", "longtext"),
      f("ระดับขั้น", "longtext"),
    ]),
  ];
}

/** Seeds default types once per project; deleting them all later sticks. */
export async function ensureCodexSeeded(projectId: string) {
  await db.transaction("rw", db.projects, db.entityTypes, async () => {
    const project = await db.projects.get(projectId);
    if (!project || project.codexSeeded) return;
    if ((await db.entityTypes.where("projectId").equals(projectId).count()) === 0) {
      await db.entityTypes.bulkAdd(defaultTypes(projectId));
    }
    await db.projects.update(projectId, { codexSeeded: true });
  });
}

const clean = (list: string[]) => [...new Set(list.map((s) => s.trim()).filter(Boolean))];

// --- Types ---

export function projectTypes(projectId: string) {
  return db.entityTypes.where("projectId").equals(projectId).sortBy("order");
}

export async function createEntityType(projectId: string, input: { name: string; icon: string; color: string }) {
  const order = (await db.entityTypes.where("projectId").equals(projectId).count()) + 1;
  const type: EntityType = {
    id: newId(),
    projectId,
    name: input.name.trim() || "ประเภทใหม่",
    icon: input.icon.trim() || "📁",
    color: input.color,
    fields: [],
    order,
  };
  await db.entityTypes.add(type);
  return type;
}

export async function updateEntityType(id: string, patch: Partial<Pick<EntityType, "name" | "icon" | "color" | "fields">>) {
  await db.entityTypes.update(id, patch);
}

export async function deleteEntityType(id: string) {
  const ids = await db.entities.where("typeId").equals(id).primaryKeys();
  for (const entityId of ids) await deleteEntity(entityId);
  await db.entityTypes.delete(id);
}

export const newField = (label: string, kind: FieldKind, options?: string[]) => f(label.trim() || "ฟิลด์ใหม่", kind, options);

// --- Entities ---

export async function createEntity(projectId: string, typeId: string, name: string, extra: Partial<Entity> = {}) {
  const now = Date.now();
  const entity: Entity = {
    id: newId(),
    projectId,
    typeId,
    name: name.trim() || "ไม่มีชื่อ",
    aliases: clean(extra.aliases ?? []),
    tags: clean(extra.tags ?? []),
    fields: extra.fields ?? {},
    notes: extra.notes ?? "",
    progressions: [],
    createdAt: now,
    updatedAt: now,
  };
  await db.entities.add(entity);
  return entity;
}

export async function updateEntity(
  id: string,
  patch: Partial<Pick<Entity, "name" | "aliases" | "tags" | "fields" | "notes" | "typeId">>,
) {
  const next: Partial<Entity> = { ...patch, updatedAt: Date.now() };
  if (patch.name !== undefined) next.name = patch.name.trim() || "ไม่มีชื่อ";
  if (patch.aliases) next.aliases = clean(patch.aliases);
  if (patch.tags) next.tags = clean(patch.tags);
  await db.entities.update(id, next);
}

export async function deleteEntity(id: string) {
  await db.transaction("rw", [db.entities, db.links, db.events, db.threads], async () => {
    const entity = await db.entities.get(id);
    if (!entity) return;
    await db.links.where("fromId").equals(id).delete();
    await db.links.where("toId").equals(id).delete();
    const drop = <T extends { entityIds: string[] }>(r: T) => {
      r.entityIds = r.entityIds.filter((x) => x !== id);
    };
    await db.events.where("projectId").equals(entity.projectId).modify(drop);
    await db.threads.where("projectId").equals(entity.projectId).modify(drop);
    await db.entities.delete(id);
  });
}

// --- Links (relationships) ---

export async function addLink(projectId: string, fromId: string, toId: string, label: string): Promise<EntityLink> {
  const link: EntityLink = { id: newId(), projectId, fromId, toId, label: label.trim() };
  await db.links.add(link);
  return link;
}

export async function updateLink(id: string, label: string) {
  await db.links.update(id, { label: label.trim() });
}

export async function deleteLink(id: string) {
  await db.links.delete(id);
}

// --- Progressions ---

export async function addProgression(entityId: string, input: Omit<Progression, "id" | "createdAt">) {
  const entity = await db.entities.get(entityId);
  if (!entity) return;
  const progression: Progression = { ...input, value: input.value.trim(), id: newId(), createdAt: Date.now() };
  await db.entities.update(entityId, { progressions: [...entity.progressions, progression], updatedAt: Date.now() });
}

export async function deleteProgression(entityId: string, progressionId: string) {
  const entity = await db.entities.get(entityId);
  if (!entity) return;
  await db.entities.update(entityId, { progressions: entity.progressions.filter((p) => p.id !== progressionId) });
}

// --- Timeline events ---

export async function createEvent(
  projectId: string,
  input: Partial<Omit<TimelineEvent, "id" | "projectId" | "createdAt" | "updatedAt">> & { title: string },
) {
  const now = Date.now();
  const event: TimelineEvent = {
    id: newId(),
    projectId,
    title: input.title.trim() || "เหตุการณ์",
    when: input.when?.trim() ?? "",
    sortKey: input.sortKey ?? 0,
    chapterId: input.chapterId ?? null,
    entityIds: input.entityIds ?? [],
    notes: input.notes ?? "",
    createdAt: now,
    updatedAt: now,
  };
  await db.events.add(event);
  return event;
}

export async function updateEvent(id: string, patch: Partial<Omit<TimelineEvent, "id" | "projectId">>) {
  await db.events.update(id, { ...patch, updatedAt: Date.now() });
}

export async function deleteEvent(id: string) {
  await db.events.delete(id);
}
