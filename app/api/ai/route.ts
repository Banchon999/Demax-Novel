import { OPENROUTER_URL } from "@/lib/ai/config";
import { AiRequestError, parseAiRequest } from "@/lib/ai/request";
import { createSseParser } from "@/lib/ai/sse";
import { buildUpstreamBody, upstreamError } from "@/lib/ai/upstream";

export const maxDuration = 60;

const json = (data: unknown, status = 200) => Response.json(data, { status });

/**
 * Proxy to OpenRouter. Keeps the API key on the server (env
 * OPENROUTER_API_KEY) unless the writer supplied their own, pins the model,
 * and turns the SSE stream into plain text deltas for the client.
 */
export async function POST(request: Request) {
  let body;
  try {
    body = parseAiRequest(await request.json());
  } catch (err) {
    return json({ error: err instanceof AiRequestError ? err.message : "รูปแบบคำขอไม่ถูกต้อง" }, 400);
  }

  const key = request.headers.get("x-openrouter-key")?.trim() || process.env.OPENROUTER_API_KEY || "unset";
  let upstream: Response;
  try {
    upstream = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "X-Title": "DEMAX Studio",
      },
      body: JSON.stringify(buildUpstreamBody(body)),
      signal: request.signal,
    });
  } catch {
    return json({ error: "เชื่อมต่อ AI ไม่ได้ ตรวจสอบอินเทอร์เน็ต" }, 502);
  }
  if (!upstream.ok || !upstream.body) return json({ error: upstreamError(upstream.status) }, 502);

  if (body.format === "entity") {
    const data = (await upstream.json()) as { choices?: { message?: { content?: string } }[] };
    try {
      return json({ entity: JSON.parse(data.choices?.[0]?.message?.content ?? "") });
    } catch {
      return json({ error: "AI ตอบกลับในรูปแบบที่อ่านไม่ได้ ลองใหม่อีกครั้ง" }, 502);
    }
  }

  const parser = createSseParser();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  const text = upstream.body.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        const { deltas, error } = parser.push(decoder.decode(chunk, { stream: true }));
        for (const d of deltas) controller.enqueue(encoder.encode(d));
        if (error) controller.enqueue(encoder.encode(`\n\n⚠️ ${error}`));
      },
    }),
  );
  return new Response(text, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
}
