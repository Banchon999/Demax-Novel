"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { PlusIcon } from "@/components/icons";
import { ProjectNav } from "@/components/project/project-nav";
import { BackLink, PageTitle, TopBar } from "@/components/top-bar";
import { Button, ConfirmButton, EmptyState, Field, Loading, Sheet, inputClass } from "@/components/ui";
import { db } from "@/lib/db";
import { createEvent, deleteEvent, updateEvent } from "@/lib/db/codex";
import { projectChapters } from "@/lib/db/repo";
import type { Chapter, Entity, EntityType, TimelineEvent } from "@/lib/db/schema";
import { useCodex } from "@/lib/hooks/use-codex";

export function TimelineView() {
  const projectId = useSearchParams().get("p") ?? "";
  const project = useLiveQuery(() => db.projects.get(projectId).then((p) => p ?? null), [projectId]);
  const chapters = useLiveQuery(() => projectChapters(projectId), [projectId]);
  const events = useLiveQuery(() => db.events.where("projectId").equals(projectId).toArray(), [projectId]);
  const codex = useCodex(projectId);
  const [focus, setFocus] = useState<string>("");
  const [editing, setEditing] = useState<TimelineEvent | "new" | null>(null);

  if (project === undefined || !chapters || !events || !codex.ready) return <Loading />;
  if (project === null) return <p className="p-10 text-center text-muted">ไม่พบเรื่องนี้</p>;

  const chapterById = new Map(chapters.map((c) => [c.id, c]));
  const sorted = [...events]
    .filter((e) => !focus || e.entityIds.includes(focus))
    .sort((a, b) => a.sortKey - b.sortKey || a.createdAt - b.createdAt);
  const involved = codex.entities.filter((e) => events.some((ev) => ev.entityIds.includes(e.id)));

  return (
    <>
      <TopBar>
        <BackLink href={`/project?id=${projectId}`} label="กลับไปหน้าเรื่อง" />
        <PageTitle>{project.title}</PageTitle>
      </TopBar>
      <ProjectNav projectId={projectId} active="timeline" />
      <main id="main" className="mx-auto max-w-2xl space-y-4 px-4 pb-24 pt-4">
        {involved.length > 0 && (
          <label className="flex items-center gap-2 text-sm">
            <span className="shrink-0 text-muted">ดูเส้นเวลาของ</span>
            <select className={`${inputClass} py-2 text-sm`} value={focus} onChange={(e) => setFocus(e.target.value)}>
              <option value="">ทุกเหตุการณ์</option>
              {involved.map((e) => (
                <option key={e.id} value={e.id}>
                  {codex.typeById.get(e.typeId)?.icon} {e.name}
                </option>
              ))}
            </select>
          </label>
        )}
        {sorted.length === 0 ? (
          <EmptyState icon={<span className="text-2xl">⏳</span>} title="ยังไม่มีเหตุการณ์">
            บันทึกประวัติศาสตร์ของโลกและเหตุการณ์สำคัญ เรียงตามเวลาในโลกของเรื่อง (ไม่ต้องตรงกับลำดับตอน)
          </EmptyState>
        ) : (
          <ol className="relative space-y-3 border-l-2 border-accent/30 pl-5">
            {sorted.map((ev) => {
              const ch = ev.chapterId ? chapterById.get(ev.chapterId) : undefined;
              return (
                <li key={ev.id} className="relative">
                  <span className="absolute -left-[1.72rem] top-3 size-3 rounded-full bg-accent ring-4 ring-bg" aria-hidden="true" />
                  <button
                    type="button"
                    onClick={() => setEditing(ev)}
                    className="block w-full rounded-2xl bg-surface p-3 text-left ring-1 ring-white/5 hover:ring-white/15"
                  >
                    <span className="block text-xs font-semibold text-accent-soft">{ev.when || "ไม่ระบุเวลา"}</span>
                    <span className="block font-semibold">{ev.title}</span>
                    {ev.notes && <span className="mt-0.5 block line-clamp-2 text-sm text-fg/75">{ev.notes}</span>}
                    <span className="mt-1.5 flex flex-wrap gap-1">
                      {ch && <span className="rounded-full bg-sky-500/15 px-2 text-[0.7rem] text-sky-200">ตอนที่ {ch.order}</span>}
                      {ev.entityIds.map((id) => {
                        const e = codex.entityById.get(id);
                        return e ? (
                          <span key={id} className="rounded-full bg-white/5 px-2 text-[0.7rem] text-fg/75">
                            {codex.typeById.get(e.typeId)?.icon} {e.name}
                          </span>
                        ) : null;
                      })}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        )}
      </main>
      <div className="pointer-events-none fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-30 mx-auto flex max-w-2xl justify-end px-4">
        <Button variant="primary" className="pointer-events-auto rounded-full shadow-lg shadow-accent/30" onClick={() => setEditing("new")}>
          <PlusIcon className="size-5" /> เหตุการณ์
        </Button>
      </div>
      <Sheet open={editing !== null} onClose={() => setEditing(null)} title={editing === "new" ? "เพิ่มเหตุการณ์" : "แก้ไขเหตุการณ์"}>
        {editing !== null && (
          <EventForm
            key={editing === "new" ? "new" : editing.id}
            event={editing === "new" ? null : editing}
            nextSortKey={(sorted.at(-1)?.sortKey ?? 0) + 10}
            chapters={chapters}
            entities={codex.entities}
            types={codex.typeById}
            onSave={async (data) => {
              if (editing === "new") await createEvent(projectId, data);
              else await updateEvent(editing.id, data);
              setEditing(null);
            }}
            onDelete={editing === "new" ? undefined : () => deleteEvent(editing.id).then(() => setEditing(null))}
          />
        )}
      </Sheet>
    </>
  );
}

type EventData = Pick<TimelineEvent, "title" | "when" | "sortKey" | "chapterId" | "entityIds" | "notes">;

function EventForm({
  event,
  nextSortKey,
  chapters,
  entities,
  types,
  onSave,
  onDelete,
}: {
  event: TimelineEvent | null;
  nextSortKey: number;
  chapters: Chapter[];
  entities: Entity[];
  types: Map<string, EntityType>;
  onSave: (data: EventData) => void;
  onDelete?: () => void;
}) {
  const [title, setTitle] = useState(event?.title ?? "");
  const [when, setWhen] = useState(event?.when ?? "");
  const [sortKey, setSortKey] = useState(String(event?.sortKey ?? nextSortKey));
  const [chapterId, setChapterId] = useState(event?.chapterId ?? "");
  const [entityIds, setEntityIds] = useState<string[]>(event?.entityIds ?? []);
  const [notes, setNotes] = useState(event?.notes ?? "");
  const [q, setQ] = useState("");
  const matches = entities.filter((e) => entityIds.includes(e.id) || !q || e.name.includes(q)).slice(0, 40);

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSave({ title, when, sortKey: Number(sortKey) || 0, chapterId: chapterId || null, entityIds, notes });
      }}
    >
      <Field label="ชื่อเหตุการณ์">
        <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} required autoFocus placeholder="เช่น สงครามแยกแผ่นดิน" />
      </Field>
      <div className="grid grid-cols-[1fr_7rem] gap-2">
        <Field label="เวลาในโลกของเรื่อง">
          <input className={inputClass} value={when} onChange={(e) => setWhen(e.target.value)} placeholder="ปีที่ 1024 ฤดูหนาว" />
        </Field>
        <Field label="ลำดับ">
          <input className={inputClass} inputMode="decimal" value={sortKey} onChange={(e) => setSortKey(e.target.value.replace(/[^\d.-]/g, ""))} />
        </Field>
      </div>
      <p className="-mt-2 text-xs text-muted">“ลำดับ” เป็นตัวเลขอะไรก็ได้ที่ใช้เรียง เช่น ปี หรือเลขวัน ตัวน้อยอยู่ก่อน</p>
      <Field label="เกิดขึ้นในตอน (ไม่บังคับ)">
        <select className={inputClass} value={chapterId} onChange={(e) => setChapterId(e.target.value)}>
          <option value="">— เหตุการณ์ในอดีต / นอกเนื้อเรื่อง —</option>
          {chapters.map((c) => (
            <option key={c.id} value={c.id}>
              ตอนที่ {c.order}: {c.title}
            </option>
          ))}
        </select>
      </Field>
      {entities.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-sm font-medium text-fg/90">ผู้เกี่ยวข้อง / สถานที่</span>
          <input className={`${inputClass} py-2 text-sm`} placeholder="ค้นหา" value={q} onChange={(e) => setQ(e.target.value)} aria-label="ค้นหาผู้เกี่ยวข้อง" />
          <div className="flex max-h-36 flex-wrap gap-1.5 overflow-y-auto">
            {matches.map((e) => {
              const on = entityIds.includes(e.id);
              return (
                <button
                  key={e.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setEntityIds((ids) => (on ? ids.filter((x) => x !== e.id) : [...ids, e.id]))}
                  className={`rounded-full px-3 py-1 text-sm ring-1 ${on ? "bg-accent text-white ring-accent" : "bg-surface-2 ring-white/10"}`}
                >
                  {types.get(e.typeId)?.icon} {e.name}
                </button>
              );
            })}
          </div>
        </div>
      )}
      <Field label="รายละเอียด">
        <textarea className={`${inputClass} field-sizing-content min-h-20`} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>
      <Button type="submit" variant="primary" className="w-full">
        บันทึก
      </Button>
      {onDelete && (
        <ConfirmButton className="w-full" onConfirm={onDelete}>
          ลบเหตุการณ์
        </ConfirmButton>
      )}
    </form>
  );
}
