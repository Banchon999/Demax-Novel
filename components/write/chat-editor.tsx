"use client";

import { useRef, useState, type ReactNode } from "react";
import { ArrowDownIcon, ArrowUpIcon, PlusIcon, SendIcon } from "@/components/icons";
import { Button, ConfirmButton, Field, IconButton, Segmented, Sheet, inputClass } from "@/components/ui";
import { findMentions, type Term } from "@/lib/codex/mentions";
import { newId } from "@/lib/db/repo";
import type { ChapterContent, ChatCast, ChatContent, ChatMessage, ChatMessageKind } from "@/lib/db/schema";

type ChatChapter = Extract<ChapterContent, { kind: "chat" }>;

const CAST_COLORS = ["#a78bfa", "#f472b6", "#38bdf8", "#34d399", "#fbbf24", "#fb7185", "#f97316", "#94a3b8"];

/** Who the next message is from. */
type Speaker = { kind: "msg"; castId: string } | { kind: "narration" } | { kind: "system" };

const speakerOf = (m: ChatMessage): Speaker =>
  m.kind === "msg" && m.castId ? { kind: "msg", castId: m.castId } : { kind: m.kind === "system" ? "system" : "narration" };

const sameSpeaker = (a: Speaker, b: Speaker) =>
  a.kind === b.kind && (a.kind !== "msg" || (b.kind === "msg" && a.castId === b.castId));

export type CodexPick = { id: string; name: string; icon: string };

export function ChatEditor({
  initial,
  onChange,
  fontSize,
  terms,
  colorOf,
  characters,
}: {
  initial: ChatChapter;
  onChange: (content: ChapterContent) => void;
  fontSize: number;
  terms: Term[];
  colorOf: (entityId: string) => string;
  /** Codex entries offered as quick picks when adding a cast member. */
  characters: CodexPick[];
}) {
  const [chat, setChat] = useState<ChatContent>(initial.chat);
  const [speaker, setSpeaker] = useState<Speaker>(() =>
    initial.chat.cast[0] ? { kind: "msg", castId: initial.chat.cast[0].id } : { kind: "narration" },
  );
  const [draft, setDraft] = useState("");
  const [insertAfter, setInsertAfter] = useState<string | null>(null);
  const [castSheet, setCastSheet] = useState<ChatCast | "new" | null>(null);
  const [editing, setEditing] = useState<ChatMessage | null>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const castById = new Map(chat.cast.map((c) => [c.id, c]));

  function commit(next: ChatContent) {
    setChat(next);
    onChange({ kind: "chat", chat: next });
  }

  function send() {
    const text = draft.trim();
    if (!text) return;
    const message: ChatMessage = {
      id: newId(),
      kind: speaker.kind as ChatMessageKind,
      castId: speaker.kind === "msg" ? speaker.castId : null,
      text,
    };
    const messages = [...chat.messages];
    const at = insertAfter ? messages.findIndex((m) => m.id === insertAfter) + 1 : messages.length;
    messages.splice(at || messages.length, 0, message);
    commit({ ...chat, messages });
    setDraft("");
    if (insertAfter) setInsertAfter(message.id);
    else
      requestAnimationFrame(() => {
        const list = listRef.current;
        if (list) list.scrollTop = list.scrollHeight;
      });
    inputRef.current?.focus();
  }

  function updateMessage(id: string, patch: Partial<ChatMessage>) {
    commit({ ...chat, messages: chat.messages.map((m) => (m.id === id ? { ...m, ...patch } : m)) });
  }

  function moveMessage(id: string, dir: -1 | 1) {
    const messages = [...chat.messages];
    const i = messages.findIndex((m) => m.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= messages.length) return;
    [messages[i], messages[j]] = [messages[j], messages[i]];
    commit({ ...chat, messages });
  }

  function saveCast(cast: ChatCast) {
    const exists = chat.cast.some((c) => c.id === cast.id);
    commit({ ...chat, cast: exists ? chat.cast.map((c) => (c.id === cast.id ? cast : c)) : [...chat.cast, cast] });
    if (!exists) setSpeaker({ kind: "msg", castId: cast.id });
  }

  function removeCast(id: string) {
    // Lines from a removed character are kept as narration, not lost.
    commit({
      cast: chat.cast.filter((c) => c.id !== id),
      messages: chat.messages.map((m) => (m.castId === id ? { ...m, castId: null, kind: "narration" } : m)),
    });
    if (speaker.kind === "msg" && speaker.castId === id) setSpeaker({ kind: "narration" });
  }

  const insertTarget = insertAfter ? chat.messages.find((m) => m.id === insertAfter) : undefined;

  return (
    <>
      <ol ref={listRef} className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-4" style={{ fontSize }} aria-label="ข้อความในตอน">
        {chat.messages.length === 0 && (
          <li className="px-4 py-10 text-center text-sm text-muted">
            เพิ่มตัวละครด้านล่าง แล้วพิมพ์บทสนทนาได้เลย
            <br />
            แตะข้อความเพื่อแก้ไข ย้าย หรือแทรกข้อความ
          </li>
        )}
        {chat.messages.map((m, i) => {
          const prev = chat.messages[i - 1];
          const showName = m.kind === "msg" && (!prev || !sameSpeaker(speakerOf(prev), speakerOf(m)));
          return (
            <li key={m.id}>
              <MessageView
                terms={terms}
                colorOf={colorOf}
                message={m}
                cast={m.castId ? castById.get(m.castId) : undefined}
                showName={showName}
                highlighted={m.id === insertAfter}
                onOpen={() => setEditing(m)}
              />
            </li>
          );
        })}
      </ol>

      <div className="shrink-0 border-t border-white/10 bg-surface">
        {insertTarget && (
          <div className="flex items-center gap-2 bg-accent/15 px-3 py-1.5 text-xs text-accent-soft">
            <span className="min-w-0 flex-1 truncate">กำลังแทรกต่อจาก: {insertTarget.text}</span>
            <button type="button" className="font-semibold underline" onClick={() => setInsertAfter(null)}>
              ไปท้ายสุด
            </button>
          </div>
        )}
        <div className="flex gap-1.5 overflow-x-auto px-2 pt-2" role="radiogroup" aria-label="ผู้พูด">
          {chat.cast.map((c) => {
            const selected = speaker.kind === "msg" && speaker.castId === c.id;
            return (
              <Chip
                key={c.id}
                selected={selected}
                color={c.color}
                onClick={() => (selected ? setCastSheet(c) : setSpeaker({ kind: "msg", castId: c.id }))}
              >
                {c.name}
              </Chip>
            );
          })}
          <Chip selected={speaker.kind === "narration"} onClick={() => setSpeaker({ kind: "narration" })}>
            บรรยาย
          </Chip>
          <Chip selected={speaker.kind === "system"} onClick={() => setSpeaker({ kind: "system" })}>
            ระบบ
          </Chip>
          <button
            type="button"
            onClick={() => setCastSheet("new")}
            className="flex shrink-0 items-center gap-1 rounded-full border border-dashed border-white/20 px-3 py-1.5 text-sm text-muted hover:text-fg"
          >
            <PlusIcon className="size-4" /> ตัวละคร
          </button>
        </div>
        <form
          className="flex items-end gap-2 p-2"
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
        >
          <textarea
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                send();
              }
            }}
            enterKeyHint="send"
            rows={1}
            aria-label="พิมพ์ข้อความ"
            placeholder={
              speaker.kind === "msg"
                ? `พิมพ์ในนามของ ${castById.get(speaker.castId)?.name ?? ""}`
                : speaker.kind === "system"
                  ? "ข้อความระบบ เช่น “ไลลา ได้เข้าร่วมแชท”"
                  : "คำบรรยาย"
            }
            className={`${inputClass} field-sizing-content max-h-32 min-h-11 resize-none`}
          />
          <IconButton label="ส่งข้อความ" type="submit" className="size-11 bg-accent text-white hover:bg-accent/90">
            <SendIcon className="size-5" />
          </IconButton>
        </form>
        <p className="px-3 pb-1.5 text-[0.7rem] text-muted">แตะชื่อที่เลือกอยู่ซ้ำเพื่อแก้ไขตัวละคร · Shift+Enter ขึ้นบรรทัดใหม่</p>
      </div>

      <Sheet open={castSheet !== null} onClose={() => setCastSheet(null)} title={castSheet === "new" ? "เพิ่มตัวละคร" : "แก้ไขตัวละคร"}>
        {castSheet !== null && (
          <CastForm
            key={castSheet === "new" ? "new" : castSheet.id}
            cast={castSheet === "new" ? null : castSheet}
            defaultSide={chat.cast.length === 0 ? "right" : "left"}
            defaultColor={CAST_COLORS[chat.cast.length % CAST_COLORS.length]}
            characters={characters.filter((c) => !chat.cast.some((x) => x.entityId === c.id))}
            onSave={(c) => {
              saveCast(c);
              setCastSheet(null);
            }}
            onRemove={(id) => {
              removeCast(id);
              setCastSheet(null);
            }}
          />
        )}
      </Sheet>

      <Sheet open={editing !== null} onClose={() => setEditing(null)} title="แก้ไขข้อความ">
        {editing && (
          <MessageForm
            key={editing.id}
            message={editing}
            cast={chat.cast}
            index={chat.messages.findIndex((m) => m.id === editing.id)}
            total={chat.messages.length}
            onSave={(patch) => {
              updateMessage(editing.id, patch);
              setEditing(null);
            }}
            onMove={(dir) => moveMessage(editing.id, dir)}
            onInsertAfter={() => {
              setInsertAfter(editing.id);
              setEditing(null);
              inputRef.current?.focus();
            }}
            onDelete={() => {
              commit({ ...chat, messages: chat.messages.filter((m) => m.id !== editing.id) });
              if (insertAfter === editing.id) setInsertAfter(null);
              setEditing(null);
            }}
          />
        )}
      </Sheet>
    </>
  );
}

/** Text with codex names underlined, as in the prose editor. */
function MentionText({ text, terms, colorOf }: { text: string; terms: Term[]; colorOf: (id: string) => string }) {
  const parts: ReactNode[] = [];
  let at = 0;
  for (const m of findMentions(text, terms)) {
    if (m.from > at) parts.push(text.slice(at, m.from));
    parts.push(
      <span key={m.from} className="codex-mention" style={{ ["--mention" as string]: colorOf(m.entityId) }}>
        {text.slice(m.from, m.to)}
      </span>,
    );
    at = m.to;
  }
  parts.push(text.slice(at));
  return <>{parts}</>;
}

function MessageView({
  message,
  cast,
  showName,
  highlighted,
  onOpen,
  terms,
  colorOf,
}: {
  terms: Term[];
  colorOf: (id: string) => string;
  message: ChatMessage;
  cast?: ChatCast;
  showName: boolean;
  highlighted: boolean;
  onOpen: () => void;
}) {
  const ring = highlighted ? "ring-2 ring-accent" : "";
  if (message.kind !== "msg" || !cast) {
    return (
      <button type="button" onClick={onOpen} className={`mx-auto my-2 block max-w-[85%] rounded-xl px-3 py-1 text-center ${ring}`}>
        <span
          className={
            message.kind === "system"
              ? "inline-block rounded-full bg-white/10 px-3 py-1 text-[0.85em] text-fg/80"
              : "whitespace-pre-wrap italic text-muted"
          }
        >
          <MentionText text={message.text} terms={terms} colorOf={colorOf} />
        </span>
      </button>
    );
  }
  const right = cast.side === "right";
  return (
    <div className={`flex flex-col ${right ? "items-end" : "items-start"} ${showName ? "mt-3" : ""}`}>
      {showName && (
        <span className="mb-0.5 px-2 text-[0.75em] font-semibold" style={{ color: cast.color }}>
          {cast.name}
        </span>
      )}
      <button
        type="button"
        onClick={onOpen}
        className={`max-w-[80%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-left leading-relaxed ${
          right ? "rounded-br-md" : "rounded-bl-md"
        } ${ring}`}
        style={{ backgroundColor: `${cast.color}2e`, boxShadow: `inset 0 0 0 1px ${cast.color}55` }}
      >
        <MentionText text={message.text} terms={terms} colorOf={colorOf} />
      </button>
    </div>
  );
}

function Chip({
  selected,
  color,
  onClick,
  children,
}: {
  selected: boolean;
  color?: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ring-1 transition-colors ${
        selected ? "bg-accent text-white ring-accent" : "bg-surface-2 text-fg/85 ring-white/10"
      }`}
    >
      {color && <span className="size-2.5 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />}
      {children}
    </button>
  );
}

function CastForm({
  cast,
  defaultSide,
  defaultColor,
  characters,
  onSave,
  onRemove,
}: {
  characters: CodexPick[];
  cast: ChatCast | null;
  defaultSide: ChatCast["side"];
  defaultColor: string;
  onSave: (c: ChatCast) => void;
  onRemove: (id: string) => void;
}) {
  const [name, setName] = useState(cast?.name ?? "");
  const [color, setColor] = useState(cast?.color ?? defaultColor);
  const [side, setSide] = useState<ChatCast["side"]>(cast?.side ?? defaultSide);
  const [entityId, setEntityId] = useState(cast?.entityId);
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        onSave({ id: cast?.id ?? newId(), name: name.trim(), color, side, ...(entityId ? { entityId } : {}) });
      }}
    >
      {!cast && characters.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-sm font-medium text-fg/90">เลือกจาก Codex</span>
          <div className="flex max-h-28 flex-wrap gap-1.5 overflow-y-auto">
            {characters.map((c) => (
              <button
                key={c.id}
                type="button"
                aria-pressed={entityId === c.id}
                onClick={() => {
                  setName(c.name);
                  setEntityId(c.id);
                }}
                className={`rounded-full px-3 py-1 text-sm ring-1 ${entityId === c.id ? "bg-accent text-white ring-accent" : "bg-surface-2 ring-white/10"}`}
              >
                {c.icon} {c.name}
              </button>
            ))}
          </div>
        </div>
      )}
      <Field label="ชื่อตัวละคร">
        <input
          className={inputClass}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setEntityId(undefined);
          }}
          required
          autoFocus
        />
      </Field>
      <div className="space-y-1.5">
        <span className="text-sm font-medium text-fg/90">สี</span>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="สี">
          {CAST_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={color === c}
              aria-label={c}
              onClick={() => setColor(c)}
              className={`size-9 rounded-full ring-offset-2 ring-offset-surface ${color === c ? "ring-2 ring-fg" : ""}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>
      <div className="space-y-1.5">
        <span className="text-sm font-medium text-fg/90">ฝั่งของข้อความ</span>
        <Segmented
          label="ฝั่งของข้อความ"
          value={side}
          onChange={setSide}
          options={[
            { value: "left", label: "ซ้าย" },
            { value: "right", label: "ขวา (ตัวเอก)" },
          ]}
        />
      </div>
      <Button type="submit" variant="primary" className="w-full">
        บันทึก
      </Button>
      {cast && (
        <ConfirmButton className="w-full" onConfirm={() => onRemove(cast.id)}>
          ลบตัวละคร (ข้อความจะกลายเป็นคำบรรยาย)
        </ConfirmButton>
      )}
    </form>
  );
}

function MessageForm({
  message,
  cast,
  index,
  total,
  onSave,
  onMove,
  onInsertAfter,
  onDelete,
}: {
  message: ChatMessage;
  cast: ChatCast[];
  index: number;
  total: number;
  onSave: (patch: Partial<ChatMessage>) => void;
  onMove: (dir: -1 | 1) => void;
  onInsertAfter: () => void;
  onDelete: () => void;
}) {
  const [text, setText] = useState(message.text);
  const [speaker, setSpeaker] = useState<Speaker>(speakerOf(message));
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!text.trim()) return;
        onSave({
          text: text.trim(),
          kind: speaker.kind as ChatMessageKind,
          castId: speaker.kind === "msg" ? speaker.castId : null,
        });
      }}
    >
      <textarea className={`${inputClass} min-h-28`} value={text} onChange={(e) => setText(e.target.value)} aria-label="ข้อความ" />
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="ผู้พูด">
        {cast.map((c) => (
          <Chip
            key={c.id}
            color={c.color}
            selected={speaker.kind === "msg" && speaker.castId === c.id}
            onClick={() => setSpeaker({ kind: "msg", castId: c.id })}
          >
            {c.name}
          </Chip>
        ))}
        <Chip selected={speaker.kind === "narration"} onClick={() => setSpeaker({ kind: "narration" })}>
          บรรยาย
        </Chip>
        <Chip selected={speaker.kind === "system"} onClick={() => setSpeaker({ kind: "system" })}>
          ระบบ
        </Chip>
      </div>
      <Button type="submit" variant="primary" className="w-full">
        บันทึก
      </Button>
      <div className="grid grid-cols-2 gap-2">
        <Button disabled={index <= 0} onClick={() => onMove(-1)}>
          <ArrowUpIcon className="size-4" /> เลื่อนขึ้น
        </Button>
        <Button disabled={index >= total - 1} onClick={() => onMove(1)}>
          <ArrowDownIcon className="size-4" /> เลื่อนลง
        </Button>
      </div>
      <Button className="w-full" onClick={onInsertAfter}>
        <PlusIcon className="size-4" /> แทรกข้อความต่อจากอันนี้
      </Button>
      <ConfirmButton className="w-full" onConfirm={onDelete}>
        ลบข้อความ
      </ConfirmButton>
    </form>
  );
}
