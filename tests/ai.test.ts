import { describe, expect, it } from "vitest";
import { AI_MODEL } from "@/lib/ai/config";
import { AiRequestError, parseAiRequest } from "@/lib/ai/request";
import { createSseParser } from "@/lib/ai/sse";
import { buildUpstreamBody } from "@/lib/ai/upstream";

describe("model pinning", () => {
  it("always sends Gemini 3.1 Flash Lite, whatever the client asks for", () => {
    const req = parseAiRequest({
      model: "openai/gpt-5",
      system: "s",
      messages: [{ role: "user", content: "hi" }],
    });
    const body = buildUpstreamBody(req);
    expect(AI_MODEL).toBe("google/gemini-3.1-flash-lite");
    expect(body.model).toBe(AI_MODEL);
    expect(JSON.stringify(body)).not.toContain("gpt-5");
  });

  it("uses a strict JSON schema for codex extraction", () => {
    const body = buildUpstreamBody(parseAiRequest({ format: "entity", messages: [{ role: "user", content: "x" }] }));
    expect(body.stream).toBe(false);
    expect(body).toHaveProperty("response_format.json_schema.strict", true);
  });
});

describe("parseAiRequest", () => {
  it("rejects bad roles, empty and oversized conversations", () => {
    expect(() => parseAiRequest({ messages: [] })).toThrow(AiRequestError);
    expect(() => parseAiRequest({ messages: [{ role: "system", content: "x" }] })).toThrow(AiRequestError);
    expect(() => parseAiRequest({ messages: [{ role: "user", content: "x".repeat(70_000) }] })).toThrow(AiRequestError);
    expect(() => parseAiRequest({ messages: [{ role: "assistant", content: "x" }] })).toThrow(AiRequestError);
  });
});

describe("SSE parser", () => {
  it("joins deltas across chunk boundaries and ignores comments", () => {
    const p = createSseParser();
    const a = p.push(': OPENROUTER PROCESSING\n\ndata: {"choices":[{"delta":{"content":"สวั"}}]}\n\ndata: {"choi');
    const b = p.push('ces":[{"delta":{"content":"สดี"}}]}\n\ndata: [DONE]\n\n');
    expect([...a.deltas, ...b.deltas].join("")).toBe("สวัสดี");
    expect(b.done).toBe(true);
  });

  it("surfaces mid-stream errors", () => {
    const p = createSseParser();
    expect(p.push('data: {"error":{"message":"rate limited"}}\n').error).toBe("rate limited");
  });
});
