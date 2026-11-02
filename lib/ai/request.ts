import { MAX_MESSAGES, MAX_MESSAGES_CHARS, MAX_SYSTEM_CHARS } from "./config";

export type ChatMessage = { role: "user" | "assistant"; content: string };
export type AiRequest = { system: string; messages: ChatMessage[]; format: "text" | "entity" };

export class AiRequestError extends Error {}

/** Validates the untrusted JSON body sent to /api/ai. */
export function parseAiRequest(raw: unknown): AiRequest {
  if (typeof raw !== "object" || raw === null) throw new AiRequestError("รูปแบบคำขอไม่ถูกต้อง");
  const body = raw as Record<string, unknown>;
  const system = typeof body.system === "string" ? body.system : "";
  if (system.length > MAX_SYSTEM_CHARS) throw new AiRequestError("บริบทยาวเกินไป");
  if (!Array.isArray(body.messages) || body.messages.length === 0) throw new AiRequestError("ไม่มีข้อความ");
  if (body.messages.length > MAX_MESSAGES) throw new AiRequestError("บทสนทนายาวเกินไป เริ่มแชทใหม่ได้");
  const messages = body.messages.map((m) => {
    const msg = m as Record<string, unknown>;
    if ((msg.role !== "user" && msg.role !== "assistant") || typeof msg.content !== "string") {
      throw new AiRequestError("ข้อความไม่ถูกต้อง");
    }
    return { role: msg.role, content: msg.content } as ChatMessage;
  });
  if (messages.reduce((n, m) => n + m.content.length, 0) > MAX_MESSAGES_CHARS) {
    throw new AiRequestError("บทสนทนายาวเกินไป เริ่มแชทใหม่ได้");
  }
  if (messages[messages.length - 1].role !== "user") throw new AiRequestError("ข้อความสุดท้ายต้องมาจากผู้ใช้");
  const format = body.format === "entity" ? "entity" : "text";
  return { system, messages, format };
}

/** JSON schema for turning an idea into a codex entry. */
export const ENTITY_SCHEMA = {
  name: "codex_entry",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["name", "aliases", "tags", "fields", "notes"],
    properties: {
      name: { type: "string" },
      aliases: { type: "array", items: { type: "string" } },
      tags: { type: "array", items: { type: "string" } },
      fields: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["label", "value"],
          properties: { label: { type: "string" }, value: { type: "string" } },
        },
      },
      notes: { type: "string" },
    },
  },
} as const;

export type EntityDraft = {
  name: string;
  aliases: string[];
  tags: string[];
  fields: { label: string; value: string }[];
  notes: string;
};
