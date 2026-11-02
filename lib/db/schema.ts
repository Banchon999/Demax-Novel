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
  createdAt: number;
  updatedAt: number;
};

export type ChatCast = {
  id: string;
  name: string;
  color: string;
  side: "left" | "right";
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

export type Entity = {
  id: string;
  projectId: string;
  typeId: string;
  name: string;
  aliases: string[];
  tags: string[];
  fields: Record<string, unknown>;
  notes: string;
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
