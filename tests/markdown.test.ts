import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { Markdown } from "@/components/ai/markdown";

const html = (text: string) => renderToStaticMarkup(createElement(Markdown, { text }));

describe("Markdown", () => {
  it("renders headings, lists, bold and tables", () => {
    const out = html("## ราคา\n- **ขนมปัง** 2 เหรียญ\n\n| ของ | ราคา |\n|---|---|\n| ดาบ | 50 |");
    expect(out).toContain("<strong>ขนมปัง</strong>");
    expect(out).toContain("<ul");
    expect(out).toContain("<td");
    expect(out).toContain("ดาบ");
  });

  it("never injects raw HTML", () => {
    expect(html("<img src=x onerror=alert(1)>")).toContain("&lt;img");
  });

  it("terminates on a table row without a divider", () => {
    expect(html("| a | b |\n| c | d |")).toContain("| a | b |");
  });
});
