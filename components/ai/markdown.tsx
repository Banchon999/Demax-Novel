import type { ReactNode } from "react";

/** **bold**, *italic* and `code` only; everything else stays plain text. */
function inline(text: string, key: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*\s][^*]*\*)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    const k = `${key}-${i++}`;
    if (tok.startsWith("**")) out.push(<strong key={k}>{tok.slice(2, -2)}</strong>);
    else if (tok.startsWith("`")) out.push(<code key={k} className="rounded bg-white/10 px-1">{tok.slice(1, -1)}</code>);
    else out.push(<em key={k}>{tok.slice(1, -1)}</em>);
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

const isTableRow = (l: string) => /^\s*\|.*\|\s*$/.test(l);
const isDivider = (l: string) => /^\s*\|?\s*:?-{2,}/.test(l) && /^[\s|:-]+$/.test(l);
const cells = (l: string) => l.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());

/**
 * Small Markdown renderer for AI replies. Builds React elements only (no
 * HTML injection): headings, lists, tables, quotes, rules, inline marks.
 */
export function Markdown({ text }: { text: string }) {
  const lines = text.replace(/\r/g, "").split("\n");
  const blocks: ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const key = `b${i}`;
    if (!line.trim()) {
      i++;
      continue;
    }
    const h = /^(#{1,4})\s+(.*)$/.exec(line);
    if (h) {
      const size = h[1].length <= 2 ? "text-base" : "text-[0.95em]";
      blocks.push(<p key={key} className={`mt-3 font-bold first:mt-0 ${size}`}>{inline(h[2], key)}</p>);
      i++;
      continue;
    }
    if (/^\s*([-*_])\1{2,}\s*$/.test(line)) {
      blocks.push(<hr key={key} className="my-3 border-white/10" />);
      i++;
      continue;
    }
    if (isTableRow(line) && i + 1 < lines.length && isDivider(lines[i + 1])) {
      const head = cells(line);
      const rows: string[][] = [];
      i += 2;
      while (i < lines.length && isTableRow(lines[i])) rows.push(cells(lines[i++]));
      blocks.push(
        <div key={key} className="my-2 overflow-x-auto">
          <table className="w-full text-left text-[0.9em]">
            <thead>
              <tr>{head.map((c, j) => <th key={j} className="border-b border-white/15 px-2 py-1 font-semibold">{inline(c, `${key}h${j}`)}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((r, ri) => (
                <tr key={ri} className="border-b border-white/5">
                  {r.map((c, j) => <td key={j} className="px-2 py-1 align-top">{inline(c, `${key}r${ri}c${j}`)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }
    if (/^\s*([-*•]|\d+[.)])\s+/.test(line)) {
      const ordered = /^\s*\d+[.)]/.test(line);
      const items: { depth: number; text: string }[] = [];
      while (i < lines.length && /^\s*([-*•]|\d+[.)])\s+/.test(lines[i])) {
        const depth = Math.min(2, Math.floor((/^\s*/.exec(lines[i])?.[0].length ?? 0) / 2));
        items.push({ depth, text: lines[i].replace(/^\s*([-*•]|\d+[.)])\s+/, "") });
        i++;
      }
      const List = ordered ? "ol" : "ul";
      blocks.push(
        <List key={key} className={`my-1.5 space-y-1 pl-5 ${ordered ? "list-decimal" : "list-disc"}`}>
          {items.map((it, j) => (
            <li key={j} style={{ marginLeft: `${it.depth}rem` }}>{inline(it.text, `${key}-${j}`)}</li>
          ))}
        </List>,
      );
      continue;
    }
    if (/^\s*>/.test(line)) {
      const quote: string[] = [];
      while (i < lines.length && /^\s*>/.test(lines[i])) quote.push(lines[i++].replace(/^\s*>\s?/, ""));
      blocks.push(<blockquote key={key} className="my-2 border-l-2 border-accent pl-3 text-fg/80">{inline(quote.join(" "), key)}</blockquote>);
      continue;
    }
    // Always consume the current line so odd input can never stall the loop.
    const para: string[] = [lines[i++]];
    while (i < lines.length && lines[i].trim() && !/^(#{1,4}\s|\s*([-*•]|\d+[.)])\s|\s*>)/.test(lines[i]) && !isTableRow(lines[i])) {
      para.push(lines[i++]);
    }
    blocks.push(<p key={key} className="my-1.5 whitespace-pre-line">{inline(para.join("\n"), key)}</p>);
  }
  return <div className="leading-relaxed">{blocks}</div>;
}
