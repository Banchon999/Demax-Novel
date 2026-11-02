import type { JSONContent } from "@tiptap/react";
import type { ChapterContent, ChatContent } from "@/lib/db/schema";

const INLINE_BREAKS = new Set(["hardBreak"]);

/** Flattens a TipTap document to text: one line per block, "" for rules. */
export function docToPlainText(doc: JSONContent): string {
  const lines: string[] = [];
  const inline = (node: JSONContent): string => {
    if (node.type === "text") return node.text ?? "";
    if (node.type && INLINE_BREAKS.has(node.type)) return "\n";
    return (node.content ?? []).map(inline).join("");
  };
  const block = (node: JSONContent) => {
    const children = node.content ?? [];
    const hasBlockChildren = children.some(
      (c) => c.type !== "text" && !(c.type && INLINE_BREAKS.has(c.type)),
    );
    if (node.type === "horizontalRule") lines.push("");
    else if (hasBlockChildren) children.forEach(block);
    else lines.push(inline(node));
  };
  (doc.content ?? []).forEach(block);
  return lines.join("\n");
}

export function chatToPlainText(chat: ChatContent): string {
  const names = new Map(chat.cast.map((c) => [c.id, c.name]));
  return chat.messages
    .map((m) => {
      const name = m.kind === "msg" && m.castId ? names.get(m.castId) : undefined;
      return name ? `${name}: ${m.text}` : m.text;
    })
    .join("\n");
}

export function chapterPlainText(content: ChapterContent): string {
  return content.kind === "prose" ? docToPlainText(content.doc) : chatToPlainText(content.chat);
}

/** Text that counts toward word goals: chat speaker names are excluded. */
export function chapterCountableText(content: ChapterContent): string {
  return content.kind === "prose"
    ? docToPlainText(content.doc)
    : content.chat.messages.map((m) => m.text).join("\n");
}
