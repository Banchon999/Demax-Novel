/**
 * Incremental parser for OpenAI-style server-sent events. Feed it raw
 * chunks; it returns completed text deltas and keeps partial lines.
 */
export function createSseParser() {
  let buffer = "";
  return {
    push(chunk: string): { deltas: string[]; done: boolean; error?: string } {
      buffer += chunk;
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      const deltas: string[] = [];
      let done = false;
      let error: string | undefined;
      for (const raw of lines) {
        const line = raw.trim();
        if (!line.startsWith("data:")) continue; // comments / keep-alives
        const data = line.slice(5).trim();
        if (data === "[DONE]") {
          done = true;
          continue;
        }
        try {
          const json = JSON.parse(data) as {
            choices?: { delta?: { content?: string } }[];
            error?: { message?: string };
          };
          if (json.error) error = json.error.message ?? "AI error";
          const text = json.choices?.[0]?.delta?.content;
          if (text) deltas.push(text);
        } catch {
          // A malformed event is skipped rather than killing the stream.
        }
      }
      return { deltas, done, error };
    },
  };
}
