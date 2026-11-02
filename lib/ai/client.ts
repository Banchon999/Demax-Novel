"use client";

import { db } from "@/lib/db";
import { AI_KEY_SETTING } from "./config";
import type { ChatMessage, EntityDraft } from "./request";

async function headers(): Promise<HeadersInit> {
  const key = (await db.settings.get(AI_KEY_SETTING))?.value;
  return { "Content-Type": "application/json", ...(typeof key === "string" && key ? { "x-openrouter-key": key } : {}) };
}

async function failure(res: Response): Promise<Error> {
  try {
    const body = (await res.json()) as { error?: string };
    return new Error(body.error ?? `AI error ${res.status}`);
  } catch {
    return new Error(`AI error ${res.status}`);
  }
}

/** Streams the assistant's reply, calling onDelta as text arrives. */
export async function streamAi(
  system: string,
  messages: ChatMessage[],
  opts: { signal?: AbortSignal; onDelta: (text: string) => void },
): Promise<string> {
  if (typeof navigator !== "undefined" && !navigator.onLine) throw new Error("ต้องเชื่อมต่ออินเทอร์เน็ตเพื่อใช้ผู้ช่วย AI");
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: await headers(),
    body: JSON.stringify({ system, messages, format: "text" }),
    signal: opts.signal,
  });
  if (!res.ok || !res.body) throw await failure(res);
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    const text = decoder.decode(value, { stream: true });
    full += text;
    opts.onDelta(full);
  }
  return full;
}

/** Turns free text into a structured codex entry (strict JSON schema). */
export async function extractEntity(system: string, text: string): Promise<EntityDraft> {
  const res = await fetch("/api/ai", {
    method: "POST",
    headers: await headers(),
    body: JSON.stringify({ system, messages: [{ role: "user", content: text }], format: "entity" }),
  });
  if (!res.ok) throw await failure(res);
  return ((await res.json()) as { entity: EntityDraft }).entity;
}
