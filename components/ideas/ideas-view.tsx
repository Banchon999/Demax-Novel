"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, type ReactNode } from "react";
import { LightbulbIcon, MicIcon, PinIcon } from "@/components/icons";
import { TopBar } from "@/components/top-bar";
import { Button, ConfirmButton, EmptyState, IconButton, Loading, Sheet, inputClass } from "@/components/ui";
import { timeAgo } from "@/lib/dates";
import { db } from "@/lib/db";
import { addIdea, deleteIdea, updateIdea } from "@/lib/db/repo";
import type { Idea, Project } from "@/lib/db/schema";
import { useSpeech } from "@/lib/hooks/use-speech";

const ALL = "all";
const LOOSE = "none";

export function IdeasView() {
  const router = useRouter();
  const filter = useSearchParams().get("project") ?? ALL;
  const projects = useLiveQuery(() => db.projects.orderBy("updatedAt").reverse().toArray());
  const ideas = useLiveQuery(() => db.ideas.orderBy("createdAt").reverse().toArray());
  const [text, setText] = useState("");
  const [target, setTarget] = useState<string>(filter === ALL ? LOOSE : filter);
  const [editing, setEditing] = useState<Idea | null>(null);

  const appendSpeech = useCallback((t: string) => setText((cur) => (cur ? `${cur} ${t}` : t)), []);
  const speech = useSpeech(appendSpeech);

  if (!projects || !ideas) return <Loading />;

  const names = new Map(projects.map((p) => [p.id, p.title]));
  const shown = ideas
    .filter((i) => (filter === ALL ? true : filter === LOOSE ? i.projectId === null : i.projectId === filter))
    .sort((a, b) => Number(b.pinned) - Number(a.pinned));

  const setFilter = (value: string) => {
    router.replace(value === ALL ? "/ideas" : `/ideas?project=${value}`, { scroll: false });
    if (value !== ALL) setTarget(value);
  };

  return (
    <>
      <TopBar>
        <h1 className="flex items-center gap-2 px-2 text-lg font-bold">
          <LightbulbIcon className="size-5 text-amber-300" /> กล่องไอเดีย
        </h1>
      </TopBar>
      <main id="main" className="mx-auto max-w-2xl space-y-4 px-4 pt-4">
        <form
          className="space-y-2 rounded-2xl bg-surface p-3 ring-1 ring-white/5"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!text.trim()) return;
            if (speech.listening) speech.stop();
            await addIdea(text, target === LOOSE ? null : target);
            setText("");
          }}
        >
          <textarea
            className={`${inputClass} min-h-24`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="จดไอเดียไว้ก่อนลืม: ฉาก ประโยคเด็ด ชื่อตัวละคร ปมที่อยากใส่…"
            aria-label="ไอเดียใหม่"
          />
          <div className="flex items-center gap-2">
            <select
              className={`${inputClass} min-w-0 flex-1 py-2 text-sm`}
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              aria-label="เก็บไว้ในเรื่อง"
            >
              <option value={LOOSE}>ไม่ระบุเรื่อง</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
            {speech.supported && (
              <IconButton
                label={speech.listening ? "หยุดฟังเสียง" : "พูดเพื่อจดไอเดีย"}
                active={speech.listening}
                onClick={speech.listening ? speech.stop : speech.start}
              >
                <MicIcon className={`size-5 ${speech.listening ? "animate-pulse" : ""}`} />
              </IconButton>
            )}
            <Button type="submit" variant="primary" disabled={!text.trim()}>
              จดไว้
            </Button>
          </div>
        </form>

        <div className="scroller -mx-4 flex gap-1.5 overflow-x-auto px-4" role="tablist" aria-label="กรองตามเรื่อง">
          <FilterChip active={filter === ALL} onClick={() => setFilter(ALL)}>
            ทั้งหมด
          </FilterChip>
          <FilterChip active={filter === LOOSE} onClick={() => setFilter(LOOSE)}>
            ไม่ระบุเรื่อง
          </FilterChip>
          {projects.map((p: Project) => (
            <FilterChip key={p.id} active={filter === p.id} onClick={() => setFilter(p.id)}>
              {p.title}
            </FilterChip>
          ))}
        </div>

        {shown.length === 0 ? (
          <EmptyState icon={<LightbulbIcon className="size-7" />} title="ยังไม่มีไอเดียตรงนี้">
            ไอเดียที่จดไว้จะแสดงที่นี่ ปักหมุดอันสำคัญไว้บนสุดได้
          </EmptyState>
        ) : (
          <ul className="space-y-2">
            {shown.map((i) => (
              <li key={i.id} className="flex gap-1 rounded-2xl bg-surface ring-1 ring-white/5">
                <button type="button" onClick={() => setEditing(i)} className="min-w-0 flex-1 p-3 text-left">
                  <p className="whitespace-pre-line text-sm">{i.text}</p>
                  <p className="mt-1 text-[0.7rem] text-muted">
                    {i.projectId ? names.get(i.projectId) ?? "เรื่องที่ถูกลบ" : "ไม่ระบุเรื่อง"} · {timeAgo(i.createdAt)}
                  </p>
                </button>
                <IconButton
                  label={i.pinned ? "เลิกปักหมุด" : "ปักหมุด"}
                  active={i.pinned}
                  className="m-1.5"
                  onClick={() => updateIdea(i.id, { pinned: !i.pinned })}
                >
                  <PinIcon className="size-4" />
                </IconButton>
              </li>
            ))}
          </ul>
        )}
      </main>

      <Sheet open={editing !== null} onClose={() => setEditing(null)} title="แก้ไขไอเดีย">
        {editing && (
          <IdeaForm key={editing.id} idea={editing} projects={projects} onDone={() => setEditing(null)} />
        )}
      </Sheet>
    </>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`max-w-48 shrink-0 truncate rounded-full px-3 py-1.5 text-sm ring-1 ${
        active ? "bg-accent text-white ring-accent" : "bg-surface text-fg/80 ring-white/10"
      }`}
    >
      {children}
    </button>
  );
}

function IdeaForm({ idea, projects, onDone }: { idea: Idea; projects: Project[]; onDone: () => void }) {
  const [text, setText] = useState(idea.text);
  const [projectId, setProjectId] = useState(idea.projectId ?? LOOSE);
  return (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!text.trim()) return;
        await updateIdea(idea.id, { text: text.trim(), projectId: projectId === LOOSE ? null : projectId });
        onDone();
      }}
    >
      <textarea className={`${inputClass} min-h-32`} value={text} onChange={(e) => setText(e.target.value)} aria-label="ไอเดีย" />
      <select className={inputClass} value={projectId} onChange={(e) => setProjectId(e.target.value)} aria-label="เรื่อง">
        <option value={LOOSE}>ไม่ระบุเรื่อง</option>
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.title}
          </option>
        ))}
      </select>
      <Button type="submit" variant="primary" className="w-full">
        บันทึก
      </Button>
      <ConfirmButton className="w-full" onConfirm={() => deleteIdea(idea.id).then(onDone)}>
        ลบไอเดีย
      </ConfirmButton>
    </form>
  );
}
