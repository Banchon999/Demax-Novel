import { AI_MODEL, MAX_OUTPUT_TOKENS } from "./config";
import { ENTITY_SCHEMA, type AiRequest } from "./request";

/** OpenRouter request body. The model is always AI_MODEL. */
export function buildUpstreamBody(req: AiRequest) {
  return {
    model: AI_MODEL,
    messages: [...(req.system ? [{ role: "system", content: req.system }] : []), ...req.messages],
    max_tokens: MAX_OUTPUT_TOKENS,
    temperature: req.format === "entity" ? 0.4 : 0.9,
    stream: req.format === "text",
    ...(req.format === "entity" ? { response_format: { type: "json_schema", json_schema: ENTITY_SCHEMA } } : {}),
  };
}

/** Friendly Thai message for an upstream failure. */
export function upstreamError(status: number): string {
  if (status === 401 || status === 403) return "ยังไม่ได้ตั้งค่า API key ของ OpenRouter (ตั้งได้ที่หน้าตั้งค่า)";
  if (status === 402) return "เครดิต OpenRouter ไม่พอ";
  if (status === 429) return "เรียกใช้ AI ถี่เกินไป รอสักครู่แล้วลองใหม่";
  return `AI ไม่ตอบสนอง (รหัส ${status}) ลองใหม่อีกครั้ง`;
}
