import { describe, expect, it } from "vitest";
import { countText } from "@/lib/text/wordcount";
import { chapterPlainText, docToPlainText } from "@/lib/text/plain-text";

describe("countText", () => {
  it("counts Thai words without spaces", () => {
    expect(countText("วันนี้อากาศดีมาก").words).toBe(5);
  });

  it("counts mixed Thai and English, ignoring punctuation", () => {
    expect(countText("ฉันชอบ Pizza มาก!").words).toBe(4);
  });

  it("counts characters excluding whitespace", () => {
    expect(countText("ab c\n d").chars).toBe(4);
  });

  it("returns zero for empty text", () => {
    expect(countText("   ")).toEqual({ words: 0, chars: 0 });
  });
});

describe("plain text extraction", () => {
  it("joins TipTap blocks with newlines", () => {
    const doc = {
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "บรรทัดแรก" }] },
        { type: "horizontalRule" },
        {
          type: "paragraph",
          content: [
            { type: "text", text: "สอง" },
            { type: "hardBreak" },
            { type: "text", text: "สาม" },
          ],
        },
      ],
    };
    expect(docToPlainText(doc)).toBe("บรรทัดแรก\n\nสอง\nสาม");
  });

  it("formats chat content as speaker lines", () => {
    const text = chapterPlainText({
      kind: "chat",
      chat: {
        cast: [{ id: "a", name: "ไลลา", color: "#f00", side: "left" }],
        messages: [
          { id: "1", castId: "a", kind: "msg", text: "สวัสดี" },
          { id: "2", castId: null, kind: "narration", text: "ฝนตก" },
        ],
      },
    });
    expect(text).toBe("ไลลา: สวัสดี\nฝนตก");
  });
});
