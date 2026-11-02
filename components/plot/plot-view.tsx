"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowDownIcon, ArrowUpIcon, CheckIcon, PencilIcon, PlusIcon } from "@/components/icons";
import { ProjectNav } from "@/components/project/project-nav";
import { BackLink, PageTitle, TopBar } from "@/components/top-bar";
import { Button, ConfirmButton, EmptyState, Field, IconButton, Loading, Segmented, Sheet, inputClass } from "@/components/ui";
import { db } from "@/lib/db";
import {
  ARC_COLORS,
  applyTemplate,
  createArc,
  createBeat,
  createThread,
  deleteArc,
  deleteBeat,
  deleteThread,
  moveArc,
  moveBeat,
  projectArcs,
  updateArc,
  updateBeat,
  updateThread,
} from "@/lib/db/plot";
import { projectChapters } from "@/lib/db/repo";
import type { Arc, Beat, Chapter, Entity, EntityType, PlotThread, ThreadStatus } from "@/lib/db/schema";
import { useCodex } from "@/lib/hooks/use-codex";
import { plotInsights } from "@/lib/plot/insights";
import { chapterTension } from "@/lib/plot/tension";
import { TEMPLATES, type TemplateKey } from "@/lib/plot/templates";
import { TensionChart } from "./tension-chart";

type Tab = "arcs" | "threads" | "rhythm";

export function PlotView() {
  const projectId = useSearchParams().get("p") ?? "";
  const project = useLiveQuery(() => db.projects.get(projectId).then((p) => p ?? null), [projectId]);
  const chapters = useLiveQuery(() => projectChapters(projectId), [projectId]);
  const arcs = useLiveQuery(() => projectArcs(projectId), [projectId]);
  const beats = useLiveQuery(() => db.beats.where("projectId").equals(projectId).sortBy("order"), [projectId]);
  const threads = useLiveQuery(() => db.threads.where("projectId").equals(projectId).toArray(), [projectId]);
  const codex = useCodex(projectId);
  const [tab, setTab] = useState<Tab>("arcs");
  const [sheet, setSheet] = useState<
    | { kind: "arc"; arc: Arc | null }
    | { kind: "beat"; beat: Beat | null; arcId: string }
    | { kind: "template"; arcId: string }
    | { kind: "thread"; thread: PlotThread | null }
    | null
  >(null);

  const insights = useMemo(
    () =>
      chapters && arcs && beats && threads ? plotInsights({ chapters, arcs, beats, threads }) : [],
    [chapters, arcs, beats, threads],
  );

  if (project === undefined || !chapters || !arcs || !beats || !threads || !codex.ready) return <Loading />;
  if (project === null) return <p className="p-10 text-center text-muted">ไม่พบเรื่องนี้</p>;

  const chapterById = new Map(chapters.map((c) => [c.id, c]));
  const close = () => setSheet(null);
  const openThreads = threads.filter((t) => t.status === "open").length;

  return (
    <>
      <TopBar>
        <BackLink href={`/project?id=${projectId}`} label="กลับไปหน้าเรื่อง" />
        <PageTitle>{project.title}</PageTitle>
      </TopBar>
      <ProjectNav projectId={projectId} active="plot" />
      <main id="main" className="mx-auto max-w-2xl space-y-4 px-4 pb-24 pt-4">
        <Segmented
          label="ส่วนของพล็อต"
          value={tab}
          onChange={setTab}
          options={[
            { value: "arcs", label: "ภาค & จังหวะ" },
            { value: "threads", label: `ปมที่ปูไว้${openThreads ? ` (${openThreads})` : ""}` },
            { value: "rhythm", label: `ภาพรวม${insights.length ? ` ⚠${insights.length}` : ""}` },
          ]}
        />

        {tab === "arcs" &&
          (arcs.length === 0 ? (
            <EmptyState icon={<span className="text-2xl">🗺️</span>} title="ยังไม่มีภาค (Arc)">
              แบ่งเรื่องเป็นภาค แล้ววางจังหวะ (beat) สำคัญของแต่ละภาค เลือกโครงสำเร็จรูปได้ เช่น Save the Cat หรือจังหวะเว็บนิยาย
            </EmptyState>
          ) : (
            <ol className="space-y-4">
              {arcs.map((arc, ai) => {
                const mine = beats.filter((b) => b.arcId === arc.id);
                const orders = mine.map((b) => (b.chapterId ? chapterById.get(b.chapterId)?.order : undefined)).filter((o): o is number => o !== undefined);
                const done = mine.filter((b) => b.done).length;
                return (
                  <li key={arc.id} className="overflow-hidden rounded-2xl bg-surface ring-1 ring-white/5" style={{ boxShadow: `inset 4px 0 0 ${arc.color}` }}>
                    <div className="flex items-start gap-2 p-3 pl-4">
                      <div className="min-w-0 flex-1">
                        <p className="font-bold">{arc.title}</p>
                        <p className="text-xs text-muted">
                          {orders.length ? `ตอนที่ ${Math.min(...orders)}–${Math.max(...orders)} · ` : ""}
                          {done}/{mine.length} จังหวะเสร็จ
                        </p>
                        {arc.summary && <p className="mt-1 whitespace-pre-line text-sm text-fg/80">{arc.summary}</p>}
                      </div>
                      <IconButton label="เลื่อนภาคขึ้น" disabled={ai === 0} className="size-8" onClick={() => moveArc(arc.id, -1)}>
                        <ArrowUpIcon className="size-4" />
                      </IconButton>
                      <IconButton label={`แก้ไขภาค ${arc.title}`} className="size-8" onClick={() => setSheet({ kind: "arc", arc })}>
                        <PencilIcon className="size-4" />
                      </IconButton>
                    </div>
                    <ol className="space-y-1 px-2 pb-2">
                      {mine.map((b) => {
                        const ch = b.chapterId ? chapterById.get(b.chapterId) : undefined;
                        return (
                          <li key={b.id} className="flex items-center gap-1 rounded-xl bg-surface-2">
                            <button
                              type="button"
                              role="checkbox"
                              aria-checked={b.done}
                              aria-label={`${b.title} เสร็จแล้ว`}
                              onClick={() => updateBeat(b.id, { done: !b.done })}
                              className={`m-1.5 grid size-7 shrink-0 place-items-center rounded-lg ring-1 ${b.done ? "bg-emerald-500/80 text-white ring-emerald-400" : "ring-white/20"}`}
                            >
                              {b.done && <CheckIcon className="size-4" />}
                            </button>
                            <button type="button" onClick={() => setSheet({ kind: "beat", beat: b, arcId: arc.id })} className="min-w-0 flex-1 py-2 pr-2 text-left">
                              <span className={`block truncate text-sm font-medium ${b.done ? "text-muted line-through" : ""}`}>{b.title}</span>
                              <span className="flex items-center gap-2 text-[0.7rem] text-muted">
                                <TensionDots value={b.tension} />
                                {ch ? <span className="text-sky-200">ตอนที่ {ch.order}</span> : <span>ยังไม่ได้วางตอน</span>}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ol>
                    <div className="grid grid-cols-2 gap-2 px-2 pb-3">
                      <Button className="min-h-9" onClick={() => setSheet({ kind: "beat", beat: null, arcId: arc.id })}>
                        <PlusIcon className="size-4" /> จังหวะ
                      </Button>
                      <Button className="min-h-9" onClick={() => setSheet({ kind: "template", arcId: arc.id })}>
                        ใช้โครงสำเร็จรูป
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ol>
          ))}

        {tab === "threads" &&
          (threads.length === 0 ? (
            <EmptyState icon={<span className="text-2xl">🧵</span>} title="ยังไม่มีปม">
              เก็บทุกการปูเรื่อง ความลับ และ “ปืนของเชคอฟ” ไว้ที่นี่ แล้วระบบจะเตือนถ้าปูไว้นานแต่ยังไม่เฉลย
            </EmptyState>
          ) : (
            <ul className="space-y-2">
              {[...threads]
                .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || a.createdAt - b.createdAt)
                .map((t) => {
                  const plant = t.plantChapterId ? chapterById.get(t.plantChapterId) : undefined;
                  const payoff = t.payoffChapterId ? chapterById.get(t.payoffChapterId) : undefined;
                  const age = plant && t.status === "open" ? chapters.length - plant.order : 0;
                  return (
                    <li key={t.id}>
                      <button
                        type="button"
                        onClick={() => setSheet({ kind: "thread", thread: t })}
                        className="block w-full rounded-2xl bg-surface p-3 text-left ring-1 ring-white/5 hover:ring-white/15"
                      >
                        <span className="flex items-center gap-2">
                          <span className={`rounded-full px-2 py-0.5 text-[0.7rem] ${STATUS_STYLE[t.status]}`}>{STATUS_LABEL[t.status]}</span>
                          <span className="min-w-0 flex-1 truncate font-semibold">{t.title}</span>
                        </span>
                        <span className="mt-1 block text-xs text-muted">
                          ปูไว้: {plant ? `ตอนที่ ${plant.order}` : "—"} → เฉลย: {payoff ? `ตอนที่ ${payoff.order}` : "ยังไม่กำหนด"}
                          {age > 0 && ` · ผ่านมา ${age} ตอน`}
                        </span>
                        {t.entityIds.length > 0 && (
                          <span className="mt-1 flex flex-wrap gap-1">
                            {t.entityIds.map((id) => {
                              const e = codex.entityById.get(id);
                              return e ? (
                                <span key={id} className="rounded-full bg-white/5 px-2 text-[0.7rem]">
                                  {codex.typeById.get(e.typeId)?.icon} {e.name}
                                </span>
                              ) : null;
                            })}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
            </ul>
          ))}

        {tab === "rhythm" && (
          <div className="space-y-4">
            <section className="space-y-2 rounded-2xl bg-surface p-4 ring-1 ring-white/5">
              <h2 className="font-bold">กราฟความตึงเครียด</h2>
              <TensionChart points={chapterTension(chapters, beats)} titleOf={(id) => chapterById.get(id)?.title ?? ""} />
            </section>
            <section className="space-y-2 rounded-2xl bg-surface p-4 ring-1 ring-white/5">
              <h2 className="font-bold">สิ่งที่ควรรู้</h2>
              {insights.length === 0 ? (
                <p className="text-sm text-muted">ยังไม่พบจุดที่น่าห่วง ✓</p>
              ) : (
                <ul className="space-y-1.5 text-sm">
                  {insights.map((i) => (
                    <li key={i.message} className="flex gap-2 rounded-xl bg-amber-500/10 p-2.5 text-amber-100 ring-1 ring-amber-500/25">
                      <span aria-hidden="true">⚠</span>
                      <span>{i.message}</span>
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-xs text-muted">เป็นข้อสังเกต ไม่ใช่กฎ — เลือกใช้ตามที่เหมาะกับเรื่อง</p>
            </section>
          </div>
        )}
      </main>

      {tab !== "rhythm" && (
        <div className="pointer-events-none fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-30 mx-auto flex max-w-2xl justify-end px-4">
          <Button
            variant="primary"
            className="pointer-events-auto rounded-full shadow-lg shadow-accent/30"
            onClick={() => setSheet(tab === "arcs" ? { kind: "arc", arc: null } : { kind: "thread", thread: null })}
          >
            <PlusIcon className="size-5" /> {tab === "arcs" ? "ภาคใหม่" : "ปมใหม่"}
          </Button>
        </div>
      )}

      <Sheet open={sheet?.kind === "arc"} onClose={close} title={sheet?.kind === "arc" && sheet.arc ? "แก้ไขภาค" : "ภาคใหม่"}>
        {sheet?.kind === "arc" && (
          <ArcForm
            key={sheet.arc?.id ?? "new"}
            arc={sheet.arc}
            onSave={async (data, template) => {
              if (sheet.arc) await updateArc(sheet.arc.id, data);
              else {
                const arc = await createArc(projectId, data);
                if (template) await applyTemplate(arc.id, template);
              }
              close();
            }}
            onDelete={sheet.arc ? () => deleteArc(sheet.arc!.id).then(close) : undefined}
          />
        )}
      </Sheet>
      <Sheet open={sheet?.kind === "beat"} onClose={close} title={sheet?.kind === "beat" && sheet.beat ? "แก้ไขจังหวะ" : "จังหวะใหม่"}>
        {sheet?.kind === "beat" && (
          <BeatForm
            key={sheet.beat?.id ?? "new"}
            beat={sheet.beat}
            chapters={chapters}
            onSave={async (data) => {
              if (sheet.beat) await updateBeat(sheet.beat.id, data);
              else await createBeat(sheet.arcId, data);
              close();
            }}
            onMove={sheet.beat ? (dir) => moveBeat(sheet.beat!.id, dir) : undefined}
            onDelete={sheet.beat ? () => deleteBeat(sheet.beat!.id).then(close) : undefined}
          />
        )}
      </Sheet>
      <Sheet open={sheet?.kind === "template"} onClose={close} title="ใช้โครงสำเร็จรูป">
        {sheet?.kind === "template" && (
          <div className="space-y-2">
            <p className="text-sm text-muted">จังหวะของโครงจะต่อท้ายจังหวะที่มีอยู่ ปรับชื่อและรายละเอียดได้ทั้งหมด</p>
            {(Object.keys(TEMPLATES) as TemplateKey[]).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => applyTemplate(sheet.arcId, k).then(close)}
                className="block w-full rounded-xl bg-surface-2 p-3 text-left ring-1 ring-white/5 hover:ring-accent"
              >
                <span className="block font-semibold">{TEMPLATES[k].name}</span>
                <span className="block text-xs text-muted">{TEMPLATES[k].summary}</span>
              </button>
            ))}
          </div>
        )}
      </Sheet>
      <Sheet open={sheet?.kind === "thread"} onClose={close} title={sheet?.kind === "thread" && sheet.thread ? "แก้ไขปม" : "ปมใหม่"}>
        {sheet?.kind === "thread" && (
          <ThreadForm
            key={sheet.thread?.id ?? "new"}
            thread={sheet.thread}
            chapters={chapters}
            entities={codex.entities}
            types={codex.typeById}
            onSave={async (data) => {
              if (sheet.thread) await updateThread(sheet.thread.id, data);
              else await createThread(projectId, data);
              close();
            }}
            onDelete={sheet.thread ? () => deleteThread(sheet.thread!.id).then(close) : undefined}
          />
        )}
      </Sheet>
    </>
  );
}

const STATUS_LABEL: Record<ThreadStatus, string> = { open: "ยังไม่เฉลย", paid: "เฉลยแล้ว", dropped: "ตัดทิ้ง" };
const STATUS_STYLE: Record<ThreadStatus, string> = {
  open: "bg-amber-500/15 text-amber-200",
  paid: "bg-emerald-500/15 text-emerald-200",
  dropped: "bg-white/10 text-muted",
};
const STATUS_ORDER: Record<ThreadStatus, number> = { open: 0, paid: 1, dropped: 2 };

function TensionDots({ value }: { value: number }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`ความตึงเครียด ${value} จาก 10`}>
      {Array.from({ length: 10 }, (_, i) => (
        <span key={i} className={`h-1.5 w-1 rounded-full ${i < value ? "bg-accent" : "bg-white/15"}`} />
      ))}
    </span>
  );
}

function ArcForm({
  arc,
  onSave,
  onDelete,
}: {
  arc: Arc | null;
  onSave: (data: { title: string; summary: string; color: string }, template: TemplateKey | null) => void;
  onDelete?: () => void;
}) {
  const [title, setTitle] = useState(arc?.title ?? "");
  const [summary, setSummary] = useState(arc?.summary ?? "");
  const [color, setColor] = useState(arc?.color ?? ARC_COLORS[0]);
  const [template, setTemplate] = useState<TemplateKey | "">("");
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSave({ title, summary, color }, template || null);
      }}
    >
      <Field label="ชื่อภาค">
        <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="เช่น ภาคหอคอยต้องห้าม" required autoFocus />
      </Field>
      <Field label="เรื่องย่อของภาค / เป้าหมาย">
        <textarea className={`${inputClass} field-sizing-content min-h-20`} value={summary} onChange={(e) => setSummary(e.target.value)} />
      </Field>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="สีของภาค">
        {ARC_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            role="radio"
            aria-checked={color === c}
            aria-label={c}
            onClick={() => setColor(c)}
            className={`size-8 rounded-full ring-offset-2 ring-offset-surface ${color === c ? "ring-2 ring-fg" : ""}`}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>
      {!arc && (
        <Field label="เริ่มจากโครงสำเร็จรูป (ไม่บังคับ)">
          <select className={inputClass} value={template} onChange={(e) => setTemplate(e.target.value as TemplateKey | "")}>
            <option value="">— ว่างเปล่า —</option>
            {(Object.keys(TEMPLATES) as TemplateKey[]).map((k) => (
              <option key={k} value={k}>
                {TEMPLATES[k].name}
              </option>
            ))}
          </select>
        </Field>
      )}
      <Button type="submit" variant="primary" className="w-full">
        บันทึก
      </Button>
      {onDelete && (
        <ConfirmButton className="w-full" confirmLabel="แตะอีกครั้ง — ลบภาคและจังหวะทั้งหมด" onConfirm={onDelete}>
          ลบภาคนี้
        </ConfirmButton>
      )}
    </form>
  );
}

function ChapterSelect({ label, value, onChange, chapters, none }: { label: string; value: string; onChange: (v: string) => void; chapters: Chapter[]; none: string }) {
  return (
    <Field label={label}>
      <select className={inputClass} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{none}</option>
        {chapters.map((c) => (
          <option key={c.id} value={c.id}>
            ตอนที่ {c.order}: {c.title}
          </option>
        ))}
      </select>
    </Field>
  );
}

function BeatForm({
  beat,
  chapters,
  onSave,
  onMove,
  onDelete,
}: {
  beat: Beat | null;
  chapters: Chapter[];
  onSave: (data: { title: string; description: string; chapterId: string | null; tension: number }) => void;
  onMove?: (dir: -1 | 1) => void;
  onDelete?: () => void;
}) {
  const [title, setTitle] = useState(beat?.title ?? "");
  const [description, setDescription] = useState(beat?.description ?? "");
  const [chapterId, setChapterId] = useState(beat?.chapterId ?? "");
  const [tension, setTension] = useState(beat?.tension ?? 5);
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSave({ title, description, chapterId: chapterId || null, tension });
      }}
    >
      <Field label="จังหวะ">
        <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} required autoFocus />
      </Field>
      <Field label="เกิดอะไรขึ้น">
        <textarea className={`${inputClass} field-sizing-content min-h-20`} value={description} onChange={(e) => setDescription(e.target.value)} />
      </Field>
      <ChapterSelect label="วางไว้ในตอน" value={chapterId} onChange={setChapterId} chapters={chapters} none="— ยังไม่กำหนด —" />
      <label className="block space-y-1.5">
        <span className="flex justify-between text-sm font-medium text-fg/90">
          ความตึงเครียด <span className="tabular-nums text-accent-soft">{tension}/10</span>
        </span>
        <input type="range" min={1} max={10} value={tension} onChange={(e) => setTension(Number(e.target.value))} className="w-full accent-violet-500" />
      </label>
      <Button type="submit" variant="primary" className="w-full">
        บันทึก
      </Button>
      {onMove && (
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={() => onMove(-1)}>
            <ArrowUpIcon className="size-4" /> เลื่อนขึ้น
          </Button>
          <Button onClick={() => onMove(1)}>
            <ArrowDownIcon className="size-4" /> เลื่อนลง
          </Button>
        </div>
      )}
      {onDelete && (
        <ConfirmButton className="w-full" onConfirm={onDelete}>
          ลบจังหวะ
        </ConfirmButton>
      )}
    </form>
  );
}

function ThreadForm({
  thread,
  chapters,
  entities,
  types,
  onSave,
  onDelete,
}: {
  thread: PlotThread | null;
  chapters: Chapter[];
  entities: Entity[];
  types: Map<string, EntityType>;
  onSave: (data: Pick<PlotThread, "title" | "description" | "plantChapterId" | "payoffChapterId" | "status" | "entityIds">) => void;
  onDelete?: () => void;
}) {
  const [title, setTitle] = useState(thread?.title ?? "");
  const [description, setDescription] = useState(thread?.description ?? "");
  const [plant, setPlant] = useState(thread?.plantChapterId ?? "");
  const [payoff, setPayoff] = useState(thread?.payoffChapterId ?? "");
  const [status, setStatus] = useState<ThreadStatus>(thread?.status ?? "open");
  const [entityIds, setEntityIds] = useState(thread?.entityIds ?? []);
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSave({ title, description, plantChapterId: plant || null, payoffChapterId: payoff || null, status, entityIds });
      }}
    >
      <Field label="ปม / สิ่งที่ปูไว้">
        <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="เช่น ดาบหักในห้องใต้ดิน" required autoFocus />
      </Field>
      <Field label="รายละเอียด / จะเฉลยอย่างไร">
        <textarea className={`${inputClass} field-sizing-content min-h-20`} value={description} onChange={(e) => setDescription(e.target.value)} />
      </Field>
      <ChapterSelect label="ปูไว้ในตอน" value={plant} onChange={setPlant} chapters={chapters} none="— ยังไม่กำหนด —" />
      <ChapterSelect label="เฉลยในตอน" value={payoff} onChange={setPayoff} chapters={chapters} none="— ยังไม่กำหนด —" />
      <div className="space-y-1.5">
        <span className="text-sm font-medium text-fg/90">สถานะ</span>
        <Segmented
          label="สถานะของปม"
          value={status}
          onChange={setStatus}
          options={(["open", "paid", "dropped"] as ThreadStatus[]).map((s) => ({ value: s, label: STATUS_LABEL[s] }))}
        />
      </div>
      {entities.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-sm font-medium text-fg/90">เกี่ยวข้องกับ</span>
          <div className="flex max-h-32 flex-wrap gap-1.5 overflow-y-auto">
            {entities.map((e) => {
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
      <Button type="submit" variant="primary" className="w-full">
        บันทึก
      </Button>
      {onDelete && (
        <ConfirmButton className="w-full" onConfirm={onDelete}>
          ลบปม
        </ConfirmButton>
      )}
    </form>
  );
}
