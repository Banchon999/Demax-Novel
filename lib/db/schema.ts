import type { JSONContent } from "@tiptap/react";

export type ChapterFormat = "prose" | "chat";
export type ChapterStatus = "draft" | "done";

export type Project = {
  id: string;
  title: string;
  synopsis: string;
  /** Two gradient stops for the generated cover. */
  cover: [string, string];
  defaultFormat: ChapterFormat;
  /** Words per day; 0 disables the goal. */
  dailyGoal: number;
  /** Default codex types were created (so deleting them all sticks). */
  codexSeeded?: boolean;
  createdAt: number;
  updatedAt: number;
};

export type ChatCast = {
  id: string;
  name: string;
  color: string;
  side: "left" | "right";
  /** Codex entity this cast member was picked from, if any. */
  entityId?: string;
};

export type ChatMessageKind = "msg" | "narration" | "system";

export type ChatMessage = {
  id: string;
  /** Speaker for "msg"; null for narration/system lines. */
  castId: string | null;
  kind: ChatMessageKind;
  text: string;
};

export type ChatContent = { cast: ChatCast[]; messages: ChatMessage[] };

export type ChapterContent =
  | { kind: "prose"; doc: JSONContent }
  | { kind: "chat"; chat: ChatContent };

export type Chapter = {
  id: string;
  projectId: string;
  /** 1-based, contiguous within a project. */
  order: number;
  title: string;
  format: ChapterFormat;
  content: ChapterContent;
  wordCount: number;
  charCount: number;
  status: ChapterStatus;
  createdAt: number;
  updatedAt: number;
};

export type Snapshot = {
  id: string;
  chapterId: string;
  projectId: string;
  content: ChapterContent;
  wordCount: number;
  label: string;
  /** Auto snapshots are pruned; manual ones are kept. */
  auto: boolean;
  createdAt: number;
};

export type Idea = {
  id: string;
  projectId: string | null;
  text: string;
  pinned: boolean;
  createdAt: number;
  updatedAt: number;
};

/** Net words written in one project on one local day. */
export type WritingDay = {
  key: string; // `${projectId}:${YYYY-MM-DD}`
  projectId: string;
  date: string;
  words: number;
};

export type Setting = { key: string; value: unknown };

// --- Codex (phase 2). Declared now so the schema needs no big migration. ---

export type FieldKind = "text" | "longtext" | "number" | "select" | "tags";

export type FieldDef = {
  id: string;
  label: string;
  kind: FieldKind;
  options?: string[];
};

export type EntityType = {
  id: string;
  projectId: string;
  name: string;
  icon: string;
  color: string;
  fields: FieldDef[];
  order: number;
};

/** A field value that changes from a given chapter onward. */
export type Progression = {
  id: string;
  chapterId: string;
  fieldId: string;
  value: string;
  note: string;
  createdAt: number;
};

export type Entity = {
  id: string;
  projectId: string;
  typeId: string;
  name: string;
  aliases: string[];
  tags: string[];
  /** Field values by FieldDef.id. Tags fields hold comma-separated text. */
  fields: Record<string, string>;
  notes: string;
  progressions: Progression[];
  createdAt: number;
  updatedAt: number;
};

export type EntityLink = {
  id: string;
  projectId: string;
  fromId: string;
  toId: string;
  label: string;
};

export type TimelineEvent = {
  id: string;
  projectId: string;
  title: string;
  /** In-world date as the writer phrases it, e.g. "ปีที่ 1024 ฤดูหนาว". */
  when: string;
  /** Orders events; any number scale the writer likes (year, day…). */
  sortKey: number;
  chapterId: string | null;
  entityIds: string[];
  notes: string;
  createdAt: number;
  updatedAt: number;
};

// --- Plot board (phase 3) ---

export type Arc = {
  id: string;
  projectId: string;
  title: string;
  summary: string;
  color: string;
  order: number;
  createdAt: number;
  updatedAt: number;
};

export type Beat = {
  id: string;
  projectId: string;
  arcId: string;
  title: string;
  description: string;
  order: number;
  chapterId: string | null;
  /** 1 (calm) – 10 (peak). */
  tension: number;
  done: boolean;
};

export type ThreadStatus = "open" | "paid" | "dropped";

/** A setup that needs a payoff: foreshadowing, Chekhov's gun, mystery. */
export type PlotThread = {
  id: string;
  projectId: string;
  title: string;
  description: string;
  plantChapterId: string | null;
  payoffChapterId: string | null;
  status: ThreadStatus;
  entityIds: string[];
  createdAt: number;
  updatedAt: number;
};

// --- AI assistant (phase 4) ---

export type AiMessage = {
  role: "user" | "assistant";
  content: string;
  createdAt: number;
};

export type AiThread = {
  id: string;
  projectId: string;
  title: string;
  mode: string;
  /** Chapter used as context, if any. */
  chapterId: string | null;
  messages: AiMessage[];
  createdAt: number;
  updatedAt: number;
};
