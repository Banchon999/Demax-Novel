import type { EntityType } from "@/lib/db/schema";
import type { EntityDraft } from "./request";

/**
 * Maps AI field labels onto the type's field ids. Anything without a
 * matching field is kept in the notes instead of being dropped.
 */
export function mapDraftToFields(draft: EntityDraft, type: EntityType) {
  const norm = (s: string) => s.replace(/\s|[/()]/g, "").toLowerCase();
  const fields: Record<string, string> = {};
  const extra: string[] = [];
  for (const { label, value } of draft.fields) {
    if (!value.trim()) continue;
    const match = type.fields.find((f) => norm(f.label) === norm(label) || norm(f.label).includes(norm(label)) || norm(label).includes(norm(f.label)));
    if (match && !fields[match.id]) fields[match.id] = value.trim();
    else extra.push(`${label}: ${value.trim()}`);
  }
  const notes = [draft.notes.trim(), ...extra].filter(Boolean).join("\n");
  return { fields, notes };
}

export function extractionPrompt(type: EntityType): string {
  return `แปลงข้อความที่ได้รับเป็นข้อมูล Codex ประเภท “${type.name}” 1 รายการ
- name: ชื่อหลัก
- aliases: ชื่อเรียกอื่น/ฉายา (ถ้ามี)
- tags: แท็กสั้นๆ 0–5 คำ
- fields: ใช้ label ตามรายการนี้เท่านั้นเมื่อมีข้อมูล: ${type.fields.map((f) => f.label).join(", ") || "(ไม่มีฟิลด์)"}
- notes: ข้อมูลสำคัญอื่นที่ไม่อยู่ในฟิลด์
ตอบเป็นภาษาไทย ห้ามแต่งข้อมูลที่ไม่มีในข้อความ ถ้าข้อความมีหลายรายการ ให้เลือกรายการหลักรายการแรก`;
}
