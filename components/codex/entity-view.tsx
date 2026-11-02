"use client";

import { useLiveQuery } from "dexie-react-hooks";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { PlusIcon, TrashIcon } from "@/components/icons";
import { BackLink, PageTitle, TopBar } from "@/components/top-bar";
import { Button, ConfirmButton, Field, IconButton, Loading, Sheet, inputClass } from "@/components/ui";
import { absenceStreak, appearances } from "@/lib/codex/appearances";
import { stateAt } from "@/lib/codex/state";
import { db } from "@/lib/db";
import { addLink, addProgression, deleteEntity, deleteLink, deleteProgression, updateEntity } from "@/lib/db/codex";
import { projectChapters } from "@/lib/db/repo";
import type { Chapter, Entity, EntityType } from "@/lib/db/schema";
import { useCodex } from "@/lib/hooks/use-codex";
import { useDebouncedSave } from "@/lib/hooks/use-debounced-save";
import { ABSENCE_WARN } from "./codex-view";
import { FieldInput, FieldValue } from "./field-input";
import { TagInput } from "./tag-input";

export const RELATION_SUGGESTIONS = [
  "พ่อ", "แม่", "ลูก", "พี่น้อง", "คู่รัก", "แอบชอบ", "ศัตรู", "คู่แข่ง", "อาจารย์", "ลูกศิษย์",
  "เพื่อน", "เจ้านาย", "ลูกน้อง", "สมาชิกของ", "อาศัยอยู่ที่", "เป็นเจ้าของ", "ผู้ก่อตั้ง",
];

export function EntityView() {
  const id = useSearchParams().get("id") ?? "";
  const entity = useLiveQuery(() => db.entities.get(id).then((e) => e ?? null), [id]);
  if (entity === undefined) return <Loading />;
  if (entity === null) {
    return (
      <main id="main" className="px-4 py-16 text-center">
        <p className="font-semibold">ไม่พบข้อมูลนี้</p>
        <Link href="/" className="mt-4 inline-block text-accent-soft underline">
          กลับหน้าเรื่องของฉัน
        </Link>
      </main>
    );
  }
  return <EntityScreen key={entity.id} entity={entity} />;
}

function EntityScreen({ entity }: { entity: Entity }) {
  const router = useRouter();
  const codex = useCodex(entity.projectId);
  const chapters = useLiveQuery(() => projectChapters(entity.projectId), [entity.projectId]);
  const events = useLiveQuery(
    () => db.events.where("projectId").equals(entity.projectId).filter((e) => e.entityIds.includes(entity.id)).sortBy("sortKey"),
    [entity.projectId, entity.id],
  );
  const type = codex.typeById.get(entity.typeId);

  // Local copy so typing is instant; persisted after a short pause.
  const [name, setName] = useState(entity.name);
  const [aliases, setAliases] = useState(entity.aliases);
  const [tags, setTags] = useState(entity.tags);
  const [fields, setFields] = useState(entity.fields);
  const [notes, setNotes] = useState(entity.notes);
  const { schedule } = useDebouncedSave<Entity>((patch) => updateEntity(entity.id, patch));
  const [sheet, setSheet] = useState<"link" | "progression" | null>(null);
  const [asOf, setAsOf] = useState<number | null>(null);

  const chapterOrder = useMemo(() => new Map((chapters ?? []).map((c) => [c.id, c.order])), [chapters]);
  const seen = useMemo(() => appearances(chapters ?? [], [entity])?.get(entity.id) ?? [], [chapters, entity]);

  if (!chapters || !codex.ready || !events) return <Loading />;

  const lastOrder = chapters.length;
  const viewOrder = asOf ?? lastOrder;
  const state = stateAt({ fields, progressions: entity.progressions }, chapterOrder, viewOrder);
  const links = codex.links.filter((l) => l.fromId === entity.id || l.toId === entity.id);
  const fieldLabel = new Map((type?.fields ?? []).map((f) => [f.id, f.label]));
  const progressions = [...entity.progressions].sort(
    (a, b) => (chapterOrder.get(a.chapterId) ?? 0) - (chapterOrder.get(b.chapterId) ?? 0) || a.createdAt - b.createdAt,
  );
  const absent = absenceStreak(seen, lastOrder);

  return (
    <>
      <TopBar>
        <BackLink href={`/codex?p=${entity.projectId}`} label="กลับไป Codex" />
        <PageTitle>
          {type?.icon} {name}
        </PageTitle>
      </TopBar>

      <main id="main" className="mx-auto max-w-2xl space-y-5 px-4 pb-10 pt-4">
        <section className="space-y-4 rounded-2xl bg-surface p-4 ring-1 ring-white/5">
          <Field label="ชื่อ">
            <input
              className={`${inputClass} text-lg font-bold`}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                schedule({ name: e.target.value });
              }}
            />
          </Field>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-fg/90">ประเภท</span>
            <select
              className={inputClass}
              value={entity.typeId}
              onChange={(e) => void updateEntity(entity.id, { typeId: e.target.value })}
            >
              {codex.types.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.icon} {t.name}
                </option>
              ))}
            </select>
          </label>
          <TagInput
            label="ชื่อเรียกอื่น / ฉายา (ใช้ไฮไลต์ในเนื้อเรื่องด้วย)"
            value={aliases}
            placeholder="เช่น ไล, ราชินีเงา"
            onChange={(v) => {
              setAliases(v);
              schedule({ aliases: v });
            }}
          />
          <TagInput
            label="แท็ก"
            value={tags}
            suggestions={codex.tags}
            placeholder="เพิ่มแท็กอะไรก็ได้"
            onChange={(v) => {
              setTags(v);
              schedule({ tags: v });
            }}
          />
        </section>

        {type && type.fields.length > 0 && (
          <section className="space-y-4 rounded-2xl bg-surface p-4 ring-1 ring-white/5">
            <h2 className="font-bold">ข้อมูลตั้งต้น</h2>
            {type.fields.map((f) => (
              <FieldInput
                key={f.id}
                field={f}
                value={fields[f.id] ?? ""}
                onChange={(v) => {
                  const next = { ...fields, [f.id]: v };
                  setFields(next);
                  schedule({ fields: next });
                }}
              />
            ))}
          </section>
        )}

        <section className="space-y-3 rounded-2xl bg-surface p-4 ring-1 ring-white/5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-bold">พัฒนาการตามตอน</h2>
            <Button className="min-h-9 px-3" onClick={() => setSheet("progression")} disabled={!chapters.length || !type?.fields.length}>
              <PlusIcon className="size-4" /> บันทึกการเปลี่ยนแปลง
            </Button>
          </div>
          {!chapters.length && <p className="text-xs text-muted">เพิ่มตอนก่อน แล้วบันทึกว่าข้อมูลเปลี่ยนในตอนไหน</p>}
          {progressions.length === 0 ? (
            <p className="text-sm text-muted">เช่น เลเวลขึ้น ได้ยศใหม่ บาดเจ็บ เปลี่ยนฝ่าย — บันทึกไว้แล้วดูสถานะ ณ ตอนใดก็ได้</p>
          ) : (
            <ol className="space-y-1.5">
              {progressions.map((p) => (
                <li key={p.id} className="flex items-start gap-2 rounded-xl bg-surface-2 p-2.5 text-sm">
                  <span className="shrink-0 rounded-md bg-accent/20 px-1.5 text-xs font-bold text-accent-soft">ตอน {chapterOrder.get(p.chapterId)}</span>
                  <span className="min-w-0 flex-1">
                    <b>{fieldLabel.get(p.fieldId) ?? "ฟิลด์ที่ถูกลบ"}</b> → {p.value || "—"}
                    {p.note && <span className="block text-xs text-muted">{p.note}</span>}
                  </span>
                  <IconButton label="ลบการเปลี่ยนแปลง" className="size-8" onClick={() => deleteProgression(entity.id, p.id)}>
                    <TrashIcon className="size-4" />
                  </IconButton>
                </li>
              ))}
            </ol>
          )}
          {type && type.fields.length > 0 && chapters.length > 0 && (
            <div className="space-y-2 border-t border-white/5 pt-3">
              <label className="flex items-center gap-2 text-sm">
                <span className="shrink-0 font-semibold">สถานะ ณ</span>
                <select className={`${inputClass} py-1.5 text-sm`} value={viewOrder} onChange={(e) => setAsOf(Number(e.target.value))}>
                  {chapters.map((c) => (
                    <option key={c.id} value={c.order}>
                      ตอนที่ {c.order}: {c.title}
                    </option>
                  ))}
                </select>
              </label>
              <dl className="grid gap-1.5 text-sm">
                {type.fields.map((f) => {
                  const s = state[f.id];
                  return (
                    <div key={f.id} className="grid grid-cols-[7rem_1fr] gap-2">
                      <dt className="text-muted">{f.label}</dt>
                      <dd>
                        <FieldValue field={f} value={s?.value ?? ""} />
                        {s?.sinceOrder && <span className="ml-1 text-[0.7rem] text-accent-soft">(ตั้งแต่ตอน {s.sinceOrder})</span>}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </div>
          )}
        </section>

        <section className="space-y-3 rounded-2xl bg-surface p-4 ring-1 ring-white/5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-bold">ความสัมพันธ์</h2>
            <Button className="min-h-9 px-3" onClick={() => setSheet("link")} disabled={codex.entities.length < 2}>
              <PlusIcon className="size-4" /> เพิ่ม
            </Button>
          </div>
          {links.length === 0 ? (
            <p className="text-sm text-muted">ยังไม่มี — เชื่อมกับตัวละคร สถานที่ หรือฝ่ายอื่นได้</p>
          ) : (
            <ul className="space-y-1.5">
              {links.map((l) => {
                const otherId = l.fromId === entity.id ? l.toId : l.fromId;
                const other = codex.entityById.get(otherId);
                const outgoing = l.fromId === entity.id;
                return (
                  <li key={l.id} className="flex items-center gap-2 rounded-xl bg-surface-2 p-2.5 text-sm">
                    <span className="min-w-0 flex-1">
                      {outgoing ? (
                        <>
                          เป็น <b className="text-accent-soft">{l.label || "เกี่ยวข้องกับ"}</b> ของ{" "}
                        </>
                      ) : (
                        <>มี </>
                      )}
                      <Link href={`/entity?id=${otherId}`} className="font-semibold underline decoration-white/30">
                        {codex.typeById.get(other?.typeId ?? "")?.icon} {other?.name ?? "?"}
                      </Link>
                      {!outgoing && (
                        <>
                          {" "}
                          เป็น <b className="text-accent-soft">{l.label || "เกี่ยวข้อง"}</b>
                        </>
                      )}
                    </span>
                    <IconButton label="ลบความสัมพันธ์" className="size-8" onClick={() => deleteLink(l.id)}>
                      <TrashIcon className="size-4" />
                    </IconButton>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="space-y-3 rounded-2xl bg-surface p-4 ring-1 ring-white/5">
          <h2 className="font-bold">การปรากฏตัวในเนื้อเรื่อง</h2>
          {chapters.length === 0 ? (
            <p className="text-sm text-muted">ยังไม่มีตอน</p>
          ) : (
            <>
              <p className="text-sm">
                {seen.length ? (
                  <>
                    ปรากฏ {seen.length} จาก {lastOrder} ตอน · แรกสุดตอนที่ {seen[0]} · ล่าสุดตอนที่ {seen[seen.length - 1]}
                    {absent > 0 && (
                      <span className={absent >= ABSENCE_WARN ? " text-amber-300" : " text-muted"}> · หายไป {absent} ตอนแล้ว</span>
                    )}
                  </>
                ) : (
                  <span className="text-muted">ยังไม่ถูกเอ่ยถึงในเนื้อเรื่อง (ค้นจากชื่อและชื่อเรียกอื่น)</span>
                )}
              </p>
              <div className="flex flex-wrap gap-1" aria-label="ตอนที่ปรากฏ">
                {chapters.map((c: Chapter) => {
                  const on = seen.includes(c.order);
                  return (
                    <Link
                      key={c.id}
                      href={`/write?id=${c.id}`}
                      title={`ตอนที่ ${c.order}: ${c.title}${on ? " (ปรากฏ)" : ""}`}
                      aria-label={`ตอนที่ ${c.order}${on ? " ปรากฏ" : ""}`}
                      className={`grid size-7 place-items-center rounded-md text-[0.65rem] ${on ? "text-white" : "bg-white/5 text-muted"}`}
                      style={on ? { backgroundColor: type?.color ?? "#8b5cf6" } : undefined}
                    >
                      {c.order}
                    </Link>
                  );
                })}
              </div>
            </>
          )}
        </section>

        {events.length > 0 && (
          <section className="space-y-2 rounded-2xl bg-surface p-4 ring-1 ring-white/5">
            <h2 className="font-bold">เหตุการณ์ที่เกี่ยวข้อง</h2>
            <ul className="space-y-1 text-sm">
              {events.map((ev) => (
                <li key={ev.id}>
                  <Link href={`/timeline?p=${entity.projectId}`} className="hover:underline">
                    <span className="text-muted">{ev.when || "—"}</span> · {ev.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="space-y-2 rounded-2xl bg-surface p-4 ring-1 ring-white/5">
          <label className="block space-y-1.5">
            <span className="font-bold">โน้ต</span>
            <textarea
              className={`${inputClass} field-sizing-content min-h-28`}
              value={notes}
              placeholder="อะไรก็ได้ที่อยากจำ: ไอเดีย ความลับ แผนในอนาคต"
              onChange={(e) => {
                setNotes(e.target.value);
                schedule({ notes: e.target.value });
              }}
            />
          </label>
        </section>

        <ConfirmButton
          className="w-full"
          confirmLabel="แตะอีกครั้ง — ลบถาวร"
          onConfirm={async () => {
            await deleteEntity(entity.id);
            router.replace(`/codex?p=${entity.projectId}`);
          }}
        >
          ลบ {name}
        </ConfirmButton>
      </main>

      <Sheet open={sheet === "link"} onClose={() => setSheet(null)} title="เพิ่มความสัมพันธ์">
        {sheet === "link" && (
          <LinkForm
            self={entity}
            name={name}
            entities={codex.entities.filter((e) => e.id !== entity.id)}
            types={codex.typeById}
            onAdd={async (toId, label) => {
              await addLink(entity.projectId, entity.id, toId, label);
              setSheet(null);
            }}
          />
        )}
      </Sheet>
      <Sheet open={sheet === "progression"} onClose={() => setSheet(null)} title="บันทึกการเปลี่ยนแปลง">
        {sheet === "progression" && type && (
          <ProgressionForm
            type={type}
            chapters={chapters}
            onAdd={async (input) => {
              await addProgression(entity.id, input);
              setSheet(null);
            }}
          />
        )}
      </Sheet>
    </>
  );
}

function LinkForm({
  name,
  entities,
  types,
  onAdd,
}: {
  self: Entity;
  name: string;
  entities: Entity[];
  types: Map<string, EntityType>;
  onAdd: (toId: string, label: string) => void;
}) {
  const [q, setQ] = useState("");
  const [toId, setToId] = useState<string | null>(null);
  const [label, setLabel] = useState("");
  const matches = entities.filter((e) => !q || e.name.includes(q) || e.aliases.some((a) => a.includes(q))).slice(0, 30);
  const target = entities.find((e) => e.id === toId);
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (toId) onAdd(toId, label);
      }}
    >
      <input className={inputClass} placeholder="ค้นหาชื่อ" value={q} onChange={(e) => setQ(e.target.value)} aria-label="ค้นหาข้อมูลที่จะเชื่อม" />
      <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto" role="radiogroup" aria-label="เชื่อมกับ">
        {matches.map((e) => (
          <button
            key={e.id}
            type="button"
            role="radio"
            aria-checked={toId === e.id}
            onClick={() => setToId(e.id)}
            className={`rounded-full px-3 py-1.5 text-sm ring-1 ${toId === e.id ? "bg-accent text-white ring-accent" : "bg-surface-2 ring-white/10"}`}
          >
            {types.get(e.typeId)?.icon} {e.name}
          </button>
        ))}
      </div>
      <Field label="ความสัมพันธ์" hint={target ? `อ่านว่า: ${name} เป็น “${label || "…"}” ของ ${target.name}` : undefined}>
        <input className={inputClass} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="เช่น พี่น้อง, ศัตรู, อาจารย์" />
      </Field>
      <div className="flex flex-wrap gap-1.5">
        {RELATION_SUGGESTIONS.map((s) => (
          <button key={s} type="button" onClick={() => setLabel(s)} className="rounded-full px-2.5 py-0.5 text-xs text-muted ring-1 ring-white/10 hover:text-fg">
            {s}
          </button>
        ))}
      </div>
      <Button type="submit" variant="primary" className="w-full" disabled={!toId}>
        เชื่อมความสัมพันธ์
      </Button>
    </form>
  );
}

function ProgressionForm({
  type,
  chapters,
  onAdd,
}: {
  type: EntityType;
  chapters: Chapter[];
  onAdd: (input: { chapterId: string; fieldId: string; value: string; note: string }) => void;
}) {
  const [chapterId, setChapterId] = useState(chapters[chapters.length - 1]?.id ?? "");
  const [fieldId, setFieldId] = useState(type.fields[0]?.id ?? "");
  const [value, setValue] = useState("");
  const [note, setNote] = useState("");
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (chapterId && fieldId) onAdd({ chapterId, fieldId, value, note });
      }}
    >
      <Field label="ตั้งแต่ตอน">
        <select className={inputClass} value={chapterId} onChange={(e) => setChapterId(e.target.value)}>
          {chapters.map((c) => (
            <option key={c.id} value={c.id}>
              ตอนที่ {c.order}: {c.title}
            </option>
          ))}
        </select>
      </Field>
      <Field label="ข้อมูลที่เปลี่ยน">
        <select className={inputClass} value={fieldId} onChange={(e) => setFieldId(e.target.value)}>
          {type.fields.map((f) => (
            <option key={f.id} value={f.id}>
              {f.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="ค่าใหม่">
        <input className={inputClass} value={value} onChange={(e) => setValue(e.target.value)} required autoFocus />
      </Field>
      <Field label="หมายเหตุ (ไม่บังคับ)">
        <input className={inputClass} value={note} onChange={(e) => setNote(e.target.value)} placeholder="เช่น หลังชนะศึกที่หุบเขา" />
      </Field>
      <Button type="submit" variant="primary" className="w-full">
        บันทึก
      </Button>
    </form>
  );
}
