"use client";

import { useLiveQuery } from "dexie-react-hooks";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { PlusIcon, SettingsIcon } from "@/components/icons";
import { ProjectNav } from "@/components/project/project-nav";
import { BackLink, PageTitle, TopBar } from "@/components/top-bar";
import { Button, EmptyState, Field, IconButton, Loading, Sheet, inputClass } from "@/components/ui";
import { absenceStreak, appearances } from "@/lib/codex/appearances";
import { db } from "@/lib/db";
import { createEntity, ensureCodexSeeded } from "@/lib/db/codex";
import { projectChapters } from "@/lib/db/repo";
import type { EntityType } from "@/lib/db/schema";
import { useCodex } from "@/lib/hooks/use-codex";
import { TypeEditor } from "./type-editor";

/** Absent this many chapters (in a long enough story) → "forgotten?" hint. */
export const ABSENCE_WARN = 10;

export function CodexView() {
  const projectId = useSearchParams().get("p") ?? "";
  const router = useRouter();
  const project = useLiveQuery(() => db.projects.get(projectId).then((p) => p ?? null), [projectId]);
  const chapters = useLiveQuery(() => projectChapters(projectId), [projectId]);
  const codex = useCodex(projectId);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [tag, setTag] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);
  const [managing, setManaging] = useState<EntityType | "new" | "list" | null>(null);

  useEffect(() => {
    // Projects from before the codex existed get the starter types once.
    if (projectId) void ensureCodexSeeded(projectId);
  }, [projectId]);

  const seen = useMemo(() => appearances(chapters ?? [], codex.entities), [chapters, codex.entities]);
  const lastOrder = chapters?.length ?? 0;

  if (project === undefined || !chapters || !codex.ready) return <Loading />;
  if (project === null) return <p className="p-10 text-center text-muted">ไม่พบเรื่องนี้</p>;

  const q = query.trim().toLowerCase();
  const shown = codex.entities.filter(
    (e) =>
      (typeFilter === "all" || e.typeId === typeFilter) &&
      (!tag || e.tags.includes(tag)) &&
      (!q || [e.name, ...e.aliases, ...e.tags].some((s) => s.toLowerCase().includes(q))),
  );
  const forgotten =
    lastOrder >= ABSENCE_WARN
      ? codex.entities.filter((e) => {
          const orders = seen.get(e.id) ?? [];
          return orders.length > 0 && absenceStreak(orders, lastOrder) >= ABSENCE_WARN;
        })
      : [];

  return (
    <>
      <TopBar>
        <BackLink href={`/project?id=${projectId}`} label="กลับไปหน้าเรื่อง" />
        <PageTitle>{project.title}</PageTitle>
        <IconButton label="จัดการประเภทข้อมูล" onClick={() => setManaging("list")}>
          <SettingsIcon className="size-5" />
        </IconButton>
      </TopBar>
      <ProjectNav projectId={projectId} active="codex" />

      <main id="main" className="mx-auto max-w-2xl space-y-4 px-4 pb-24 pt-4">
        <input
          type="search"
          className={inputClass}
          placeholder="ค้นหาชื่อ ชื่อเล่น หรือแท็ก"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="ค้นหาใน Codex"
        />
        <div className="scroller -mx-4 flex gap-1.5 overflow-x-auto px-4" role="tablist" aria-label="ประเภท">
          <TypeChip active={typeFilter === "all"} onClick={() => setTypeFilter("all")}>
            ทั้งหมด {codex.entities.length}
          </TypeChip>
          {codex.types.map((t) => (
            <TypeChip key={t.id} active={typeFilter === t.id} onClick={() => setTypeFilter(t.id)}>
              {t.icon} {t.name} {codex.entities.filter((e) => e.typeId === t.id).length}
            </TypeChip>
          ))}
        </div>
        {codex.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5" aria-label="กรองด้วยแท็ก">
            {codex.tags.map((t) => (
              <button
                key={t}
                type="button"
                aria-pressed={tag === t}
                onClick={() => setTag(tag === t ? null : t)}
                className={`rounded-full px-2.5 py-0.5 text-xs ring-1 ${tag === t ? "bg-accent/25 text-accent-soft ring-accent" : "text-muted ring-white/10"}`}
              >
                #{t}
              </button>
            ))}
          </div>
        )}

        {forgotten.length > 0 && (
          <div className="rounded-2xl bg-amber-500/10 p-3 text-sm ring-1 ring-amber-500/30">
            <p className="font-semibold text-amber-200">ลืมใครไปหรือเปล่า?</p>
            <p className="mt-1 text-amber-100/80">
              {forgotten.map((e, i) => (
                <span key={e.id}>
                  {i > 0 && ", "}
                  <Link href={`/entity?id=${e.id}`} className="underline">
                    {e.name}
                  </Link>{" "}
                  (หายไป {absenceStreak(seen.get(e.id) ?? [], lastOrder)} ตอน)
                </span>
              ))}
            </p>
          </div>
        )}

        {shown.length === 0 ? (
          <EmptyState icon={<span className="text-2xl">📚</span>} title={codex.entities.length ? "ไม่พบที่ค้นหา" : "Codex ยังว่าง"}>
            {codex.entities.length ? "ลองเปลี่ยนคำค้นหรือตัวกรอง" : "เก็บตัวละคร สถานที่ ไอเทม และอื่นๆ ไว้ที่นี่ ชื่อที่บันทึกไว้จะถูกไฮไลต์ในหน้าเขียนอัตโนมัติ"}
          </EmptyState>
        ) : (
          <ul className="space-y-2">
            {shown.map((e) => {
              const type = codex.typeById.get(e.typeId);
              const orders = seen.get(e.id) ?? [];
              const firstField = type?.fields.find((f) => e.fields[f.id]);
              return (
                <li key={e.id}>
                  <Link href={`/entity?id=${e.id}`} className="flex gap-3 rounded-2xl bg-surface p-3 ring-1 ring-white/5 hover:ring-white/15">
                    <span
                      className="grid size-11 shrink-0 place-items-center rounded-xl text-xl"
                      style={{ backgroundColor: `${type?.color ?? "#888"}26` }}
                      aria-hidden="true"
                    >
                      {type?.icon ?? "📁"}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{e.name}</span>
                      {(firstField || e.aliases.length > 0) && (
                        <span className="block truncate text-xs text-muted">
                          {e.aliases.length > 0 && `ชื่ออื่น: ${e.aliases.join(", ")}`}
                          {e.aliases.length > 0 && firstField && " · "}
                          {firstField && `${firstField.label}: ${e.fields[firstField.id]}`}
                        </span>
                      )}
                      <span className="mt-1 flex flex-wrap gap-1">
                        {e.tags.slice(0, 4).map((t) => (
                          <span key={t} className="rounded-full bg-white/5 px-2 text-[0.7rem] text-fg/70">
                            #{t}
                          </span>
                        ))}
                        <span className="text-[0.7rem] text-muted">
                          {orders.length ? `ปรากฏ ${orders.length} ตอน` : "ยังไม่ปรากฏในเนื้อเรื่อง"}
                        </span>
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>

      <div className="pointer-events-none fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-30 mx-auto flex max-w-2xl justify-end px-4">
        <Button variant="primary" className="pointer-events-auto rounded-full shadow-lg shadow-accent/30" onClick={() => setAdding(true)}>
          <PlusIcon className="size-5" /> เพิ่มข้อมูล
        </Button>
      </div>

      <Sheet open={adding} onClose={() => setAdding(false)} title="เพิ่มข้อมูลใน Codex">
        {adding && (
          <NewEntityForm
            types={codex.types}
            defaultType={typeFilter !== "all" ? typeFilter : codex.types[0]?.id}
            onCreate={async (typeId, name) => {
              const e = await createEntity(projectId, typeId, name);
              setAdding(false);
              router.push(`/entity?id=${e.id}`);
            }}
            onNeedType={() => {
              setAdding(false);
              setManaging("new");
            }}
          />
        )}
      </Sheet>

      <Sheet open={managing === "list"} onClose={() => setManaging(null)} title="ประเภทข้อมูล">
        <ul className="space-y-2">
          {codex.types.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => setManaging(t)}
                className="flex w-full items-center gap-3 rounded-xl bg-surface-2 p-3 text-left ring-1 ring-white/5"
              >
                <span className="text-xl">{t.icon}</span>
                <span className="flex-1 font-medium">{t.name}</span>
                <span className="text-xs text-muted">{t.fields.length} ฟิลด์</span>
              </button>
            </li>
          ))}
        </ul>
        <Button className="mt-3 w-full" onClick={() => setManaging("new")}>
          <PlusIcon className="size-4" /> สร้างประเภทใหม่
        </Button>
      </Sheet>
      <Sheet
        open={managing === "new" || (typeof managing === "object" && managing !== null)}
        onClose={() => setManaging(null)}
        title={managing === "new" ? "สร้างประเภทใหม่" : "แก้ไขประเภท"}
      >
        {(managing === "new" || (typeof managing === "object" && managing !== null)) && (
          <TypeEditor
            key={managing === "new" ? "new" : managing.id}
            projectId={projectId}
            type={managing === "new" ? null : managing}
            entityCount={managing === "new" ? 0 : codex.entities.filter((e) => e.typeId === managing.id).length}
            onDone={() => setManaging("list")}
          />
        )}
      </Sheet>
    </>
  );
}

function TypeChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`shrink-0 rounded-full px-3 py-1.5 text-sm ring-1 ${active ? "bg-accent text-white ring-accent" : "bg-surface text-fg/80 ring-white/10"}`}
    >
      {children}
    </button>
  );
}

function NewEntityForm({
  types,
  defaultType,
  onCreate,
  onNeedType,
}: {
  types: EntityType[];
  defaultType?: string;
  onCreate: (typeId: string, name: string) => void;
  onNeedType: () => void;
}) {
  const [typeId, setTypeId] = useState(defaultType ?? "");
  const [name, setName] = useState("");
  if (types.length === 0) {
    return (
      <div className="space-y-3 text-sm">
        <p>ยังไม่มีประเภทข้อมูล สร้างประเภทก่อน เช่น ตัวละคร หรือ สถานที่</p>
        <Button variant="primary" className="w-full" onClick={onNeedType}>
          สร้างประเภท
        </Button>
      </div>
    );
  }
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (name.trim() && typeId) onCreate(typeId, name);
      }}
    >
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="ประเภท">
        {types.map((t) => (
          <button
            key={t.id}
            type="button"
            role="radio"
            aria-checked={typeId === t.id}
            onClick={() => setTypeId(t.id)}
            className={`rounded-full px-3 py-1.5 text-sm ring-1 ${typeId === t.id ? "bg-accent text-white ring-accent" : "bg-surface-2 ring-white/10"}`}
          >
            {t.icon} {t.name}
          </button>
        ))}
      </div>
      <Field label="ชื่อ">
        <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
      </Field>
      <Button type="submit" variant="primary" className="w-full" disabled={!typeId}>
        สร้างแล้วเปิดรายละเอียด
      </Button>
    </form>
  );
}
