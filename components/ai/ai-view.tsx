"use client";

import { useLiveQuery } from "dexie-react-hooks";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState, type ReactNode } from "react";
import { HistoryIcon, PlusIcon, SendIcon } from "@/components/icons";
import { ProjectNav } from "@/components/project/project-nav";
import { BackLink, PageTitle, TopBar } from "@/components/top-bar";
import { Button, ConfirmButton, IconButton, Loading, Sheet, inputClass } from "@/components/ui";
import { extractEntity, streamAi } from "@/lib/ai/client";
import { AI_MODEL_LABEL } from "@/lib/ai/config";
import { buildContext } from "@/lib/ai/context";
import { extractionPrompt, mapDraftToFields } from "@/lib/ai/entity-map";
import { AI_MODES, modeByKey, systemPrompt, type AiMode } from "@/lib/ai/modes";
import type { EntityDraft } from "@/lib/ai/request";
import { loadStory } from "@/lib/ai/story";
import { timeAgo } from "@/lib/dates";
import { db } from "@/lib/db";
import { createEntity } from "@/lib/db/codex";
import { newId } from "@/lib/db/id";
import { addIdea, appendToChapter, projectChapters } from "@/lib/db/repo";
import type { AiMessage, AiThread, EntityType } from "@/lib/db/schema";
import { useCodex } from "@/lib/hooks/use-codex";
import { Markdown } from "./markdown";

/** Timestamps for messages; only ever called from event handlers. */
const stamp = () => Date.now();

export function AiView() {
  const params = useSearchParams();
  const projectId = params.get("p") ?? "";
  const project = useLiveQuery(() => db.projects.get(projectId).then((p) => p ?? null), [projectId]);
  const chapters = useLiveQuery(() => projectChapters(projectId), [projectId]);
  const threads = useLiveQuery(() => db.aiThreads.where("projectId").equals(projectId).reverse().sortBy("updatedAt"), [projectId]);
  const codex = useCodex(projectId);

  const [threadId, setThreadId] = useState<string | null>(null);
  const [mode, setMode] = useState<AiMode>(() => modeByKey(params.get("mode") ?? "continue"));
  const [chapterChoice, setChapterChoice] = useState<string | null>(params.get("chapter"));
  const [draft, setDraft] = useState(() => (params.get("mode") ? modeByKey(params.get("mode")!).starter : modeByKey("continue").starter));
  const [streaming, setStreaming] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const abort = useRef<AbortController | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  if (project === undefined || !chapters || !threads || !codex.ready) return <Loading />;
  if (project === null) return <p className="p-10 text-center text-muted">ไม่พบเรื่องนี้</p>;

  const thread = threadId ? threads.find((t) => t.id === threadId) : undefined;
  const activeMode = thread ? modeByKey(thread.mode) : mode;
  // Default context: the chosen chapter, else the latest one for chapter modes.
  const contextChapterId = thread
    ? thread.chapterId
    : chapterChoice === "none"
      ? null
      : (chapterChoice ?? (activeMode.wantsChapter ? (chapters.at(-1)?.id ?? null) : null));
  const contextChapter = chapters.find((c) => c.id === contextChapterId);
  const messages: AiMessage[] = thread?.messages ?? [];
  const busy = streaming !== null;

  const scrollDown = () =>
    requestAnimationFrame(() => {
      const el = listRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });

  async function send() {
    const text = draft.trim();
    if (!text || busy) return;
    setError(null);
    setNotice(null);
    const story = await loadStory(projectId);
    if (!story) return;
    const now = stamp();
    const userMsg: AiMessage = { role: "user", content: text, createdAt: now };
    let current: AiThread;
    if (thread) {
      current = { ...thread, messages: [...thread.messages, userMsg], updatedAt: now };
      await db.aiThreads.put(current);
    } else {
      current = {
        id: newId(),
        projectId,
        title: text.slice(0, 60),
        mode: activeMode.key,
        chapterId: contextChapterId,
        messages: [userMsg],
        createdAt: now,
        updatedAt: now,
      };
      await db.aiThreads.add(current);
      setThreadId(current.id);
    }
    setDraft("");
    setStreaming("");
    scrollDown();
    const controller = new AbortController();
    abort.current = controller;
    let reply = "";
    try {
      const system = systemPrompt(activeMode, buildContext(story, current.chapterId));
      reply = await streamAi(
        system,
        current.messages.map((m) => ({ role: m.role, content: m.content })),
        {
          signal: controller.signal,
          onDelta: (t) => {
            reply = t;
            setStreaming(t);
          },
        },
      );
    } catch (err) {
      if (!controller.signal.aborted) setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      abort.current = null;
      setStreaming(null);
      if (reply.trim()) {
        const done: AiMessage = { role: "assistant", content: reply, createdAt: stamp() };
        await db.aiThreads.update(current.id, { messages: [...current.messages, done], updatedAt: stamp() });
      }
      scrollDown();
    }
  }

  function startNew() {
    abort.current?.abort();
    setThreadId(null);
    setError(null);
    setNotice(null);
    setDraft(mode.starter);
  }

  return (
    <>
      <TopBar>
        <BackLink href={`/project?id=${projectId}`} label="กลับไปหน้าเรื่อง" />
        <PageTitle>{project.title}</PageTitle>
        <IconButton label="ประวัติการคุย" onClick={() => setHistory(true)}>
          <HistoryIcon className="size-5" />
        </IconButton>
        <IconButton label="แชทใหม่" onClick={startNew}>
          <PlusIcon className="size-5" />
        </IconButton>
      </TopBar>
      <ProjectNav projectId={projectId} active="ai" />

      <div ref={listRef} className="mx-auto max-w-2xl space-y-3 px-4 pb-44 pt-4">
        {!thread && (
          <section className="space-y-3" aria-label="เลือกงานให้ผู้ช่วย">
            <div className="grid grid-cols-2 gap-2">
              {AI_MODES.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  aria-pressed={mode.key === m.key}
                  onClick={() => {
                    setMode(m);
                    setDraft(m.starter);
                    setChapterChoice(null);
                  }}
                  className={`flex items-center gap-2 rounded-2xl p-3 text-left text-sm font-semibold ring-1 transition-colors ${
                    mode.key === m.key ? "bg-accent/20 ring-accent" : "bg-surface ring-white/5 hover:ring-white/15"
                  }`}
                >
                  <span className="text-lg" aria-hidden="true">
                    {m.icon}
                  </span>
                  {m.label}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2 text-sm">
              <span className="shrink-0 text-muted">อ้างอิงตอน</span>
              <select
                className={`${inputClass} py-2 text-sm`}
                value={contextChapterId ?? "none"}
                onChange={(e) => setChapterChoice(e.target.value)}
              >
                <option value="none">ไม่อ้างอิงตอนใด (ใช้ข้อมูลทั้งเรื่อง)</option>
                {chapters.map((c) => (
                  <option key={c.id} value={c.id}>
                    ตอนที่ {c.order}: {c.title}
                  </option>
                ))}
              </select>
            </label>
            <p className="text-xs text-muted">
              ผู้ช่วยจะอ่านเรื่องย่อ โครงเรื่อง ปมที่ค้าง ไทม์ไลน์ และข้อมูล Codex ที่เกี่ยวข้องให้เองทุกครั้ง · โมเดล: {AI_MODEL_LABEL}
            </p>
          </section>
        )}

        {thread && (
          <p className="text-xs text-muted">
            {activeMode.icon} {activeMode.label}
            {contextChapter ? ` · อ้างอิงตอนที่ ${contextChapter.order}: ${contextChapter.title}` : " · ใช้ข้อมูลทั้งเรื่อง"}
          </p>
        )}

        {messages.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="ml-auto max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-accent/25 px-3.5 py-2 text-sm ring-1 ring-accent/40">
              {m.content}
            </div>
          ) : (
            <article key={i} className="rounded-2xl bg-surface p-3.5 text-sm ring-1 ring-white/5">
              <Markdown text={m.content} />
              <div className="mt-3 flex flex-wrap gap-1.5 border-t border-white/5 pt-2.5">
                <SmallAction onClick={() => navigator.clipboard?.writeText(m.content).then(() => setNotice("คัดลอกแล้ว"))}>คัดลอก</SmallAction>
                <SmallAction onClick={() => addIdea(m.content, projectId).then(() => setNotice("เก็บเข้ากล่องไอเดียแล้ว"))}>เก็บเป็นไอเดีย</SmallAction>
                <SmallAction onClick={() => setSaving(m.content)}>บันทึกเข้า Codex</SmallAction>
                {contextChapter && (
                  <SmallAction
                    onClick={() =>
                      appendToChapter(contextChapter.id, m.content).then(() =>
                        setNotice(`เพิ่มท้ายตอนที่ ${contextChapter.order} แล้ว (กู้คืนได้จากประวัติเวอร์ชัน)`),
                      )
                    }
                  >
                    เพิ่มท้ายตอน {contextChapter.order}
                  </SmallAction>
                )}
              </div>
            </article>
          ),
        )}
        {streaming !== null && (
          <article className="rounded-2xl bg-surface p-3.5 text-sm ring-1 ring-accent/30" aria-live="polite" aria-busy="true">
            {streaming ? <Markdown text={streaming} /> : <p className="animate-pulse text-muted">กำลังอ่านข้อมูลเรื่องและคิด…</p>}
          </article>
        )}
        {error && <p role="alert" className="rounded-xl bg-red-500/10 p-3 text-sm text-red-200 ring-1 ring-red-500/30">{error}</p>}
        {notice && (
          <p role="status" className="rounded-xl bg-emerald-500/10 p-2.5 text-sm text-emerald-200 ring-1 ring-emerald-500/30">
            {notice}
          </p>
        )}
      </div>

      <form
        className="fixed inset-x-0 bottom-[calc(3.6rem+env(safe-area-inset-bottom))] z-30 border-t border-white/10 bg-surface/95 backdrop-blur"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <div className="mx-auto flex max-w-2xl items-end gap-2 p-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                void send();
              }
            }}
            rows={1}
            aria-label="ข้อความถึงผู้ช่วย AI"
            placeholder={thread ? "ถามต่อ หรือขอให้ปรับ…" : "บอกสิ่งที่ต้องการให้ช่วย"}
            className={`${inputClass} field-sizing-content max-h-36 min-h-11 resize-none`}
          />
          {busy ? (
            <Button className="min-h-11 shrink-0" onClick={() => abort.current?.abort()}>
              หยุด
            </Button>
          ) : (
            <IconButton label="ส่ง" type="submit" disabled={!draft.trim()} className="size-11 bg-accent text-white hover:bg-accent/90">
              <SendIcon className="size-5" />
            </IconButton>
          )}
        </div>
      </form>

      <Sheet open={history} onClose={() => setHistory(false)} title="ประวัติการคุย">
        {threads.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">ยังไม่มีบทสนทนา</p>
        ) : (
          <ul className="space-y-2">
            {threads.map((t) => (
              <li key={t.id} className="flex items-center gap-2 rounded-xl bg-surface-2 ring-1 ring-white/5">
                <button
                  type="button"
                  className="min-w-0 flex-1 p-3 text-left"
                  onClick={() => {
                    setThreadId(t.id);
                    setHistory(false);
                    setError(null);
                    setNotice(null);
                    setDraft("");
                  }}
                >
                  <span className="block truncate text-sm font-semibold">
                    {modeByKey(t.mode).icon} {t.title}
                  </span>
                  <span className="block text-xs text-muted">
                    {modeByKey(t.mode).label} · {t.messages.length} ข้อความ · {timeAgo(t.updatedAt)}
                  </span>
                </button>
                <ConfirmButton className="mr-2 min-h-9 px-3" confirmLabel="ยืนยัน" onConfirm={() => {
                  if (threadId === t.id) setThreadId(null);
                  void db.aiThreads.delete(t.id);
                }}>
                  ลบ
                </ConfirmButton>
              </li>
            ))}
          </ul>
        )}
      </Sheet>

      <Sheet open={saving !== null} onClose={() => setSaving(null)} title="บันทึกเข้า Codex">
        {saving !== null && (
          <SaveToCodex
            key={saving}
            text={saving}
            types={codex.types}
            onSaved={(id, name) => {
              setSaving(null);
              setNotice(`บันทึก “${name}” เข้า Codex แล้ว`);
              void id;
            }}
            projectId={projectId}
          />
        )}
      </Sheet>
    </>
  );
}

function SmallAction({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="rounded-full px-2.5 py-1 text-xs text-fg/80 ring-1 ring-white/10 hover:bg-white/10 hover:text-fg">
      {children}
    </button>
  );
}

function SaveToCodex({
  text,
  types,
  projectId,
  onSaved,
}: {
  text: string;
  types: EntityType[];
  projectId: string;
  onSaved: (id: string, name: string) => void;
}) {
  const router = useRouter();
  const [typeId, setTypeId] = useState(types[0]?.id ?? "");
  const [draft, setDraft] = useState<EntityDraft | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const type = types.find((t) => t.id === typeId);

  if (!types.length) {
    return (
      <p className="text-sm">
        ยังไม่มีประเภทข้อมูลใน Codex —{" "}
        <Link href={`/codex?p=${projectId}`} className="text-accent-soft underline">
          ไปสร้างก่อน
        </Link>
      </p>
    );
  }
  const mapped = draft && type ? mapDraftToFields(draft, type) : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="ประเภท">
        {types.map((t) => (
          <button
            key={t.id}
            type="button"
            role="radio"
            aria-checked={typeId === t.id}
            onClick={() => {
              setTypeId(t.id);
              setDraft(null);
            }}
            className={`rounded-full px-3 py-1.5 text-sm ring-1 ${typeId === t.id ? "bg-accent text-white ring-accent" : "bg-surface-2 ring-white/10"}`}
          >
            {t.icon} {t.name}
          </button>
        ))}
      </div>
      {!draft && (
        <Button
          variant="primary"
          className="w-full"
          disabled={busy || !type}
          onClick={async () => {
            if (!type) return;
            setBusy(true);
            setError(null);
            try {
              setDraft(await extractEntity(extractionPrompt(type), text));
            } catch (err) {
              setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? "AI กำลังจัดข้อมูล…" : "ให้ AI จัดเป็นข้อมูล Codex"}
        </Button>
      )}
      {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
      {draft && type && mapped && (
        <div className="space-y-3">
          <div className="rounded-xl bg-surface-2 p-3 text-sm ring-1 ring-white/5">
            <p className="text-base font-bold">
              {type.icon} {draft.name}
            </p>
            {draft.aliases.length > 0 && <p className="text-xs text-muted">ชื่ออื่น: {draft.aliases.join(", ")}</p>}
            {draft.tags.length > 0 && <p className="text-xs text-fg/70">{draft.tags.map((t) => `#${t}`).join(" ")}</p>}
            <dl className="mt-2 grid gap-1">
              {type.fields
                .filter((f) => mapped.fields[f.id])
                .map((f) => (
                  <div key={f.id} className="grid grid-cols-[6.5rem_1fr] gap-2">
                    <dt className="text-muted">{f.label}</dt>
                    <dd className="whitespace-pre-line">{mapped.fields[f.id]}</dd>
                  </div>
                ))}
            </dl>
            {mapped.notes && <p className="mt-2 whitespace-pre-line text-xs text-fg/75">โน้ต: {mapped.notes}</p>}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={() => setDraft(null)}>ลองใหม่</Button>
            <Button
              variant="primary"
              onClick={async () => {
                const e = await createEntity(projectId, type.id, draft.name, {
                  aliases: draft.aliases,
                  tags: draft.tags,
                  fields: mapped.fields,
                  notes: mapped.notes,
                });
                onSaved(e.id, e.name);
                router.prefetch(`/entity?id=${e.id}`);
              }}
            >
              บันทึก
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
