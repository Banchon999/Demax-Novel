"use client";

import { useState } from "react";
import type { TensionPoint } from "@/lib/plot/tension";

const W = 360;
const H = 190;
const PAD = { top: 14, right: 10, bottom: 24, left: 24 };
const LINE = "#8b5cf6"; // validated against the dark surface (dataviz checks)

/**
 * Planned tension per chapter. Gaps where no beat is placed (a missing
 * value is not a zero). Tap or hover for details; a table view is offered
 * alongside for exact values.
 */
export function TensionChart({ points, titleOf }: { points: TensionPoint[]; titleOf: (chapterId: string) => string }) {
  const [active, setActive] = useState<number | null>(null);
  const [table, setTable] = useState(false);
  if (points.length === 0) return <p className="text-sm text-muted">ยังไม่มีตอน</p>;

  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
  const y = (t: number) => PAD.top + innerH - ((t - 1) / 9) * innerH;

  // Separate path segments so unplanned chapters break the line.
  const segments: string[] = [];
  let current = "";
  points.forEach((p, i) => {
    if (p.tension === null) {
      if (current) segments.push(current);
      current = "";
      return;
    }
    current += `${current ? "L" : "M"}${x(i).toFixed(1)},${y(p.tension).toFixed(1)}`;
  });
  if (current) segments.push(current);

  const labelEvery = Math.max(1, Math.ceil(points.length / 10));
  const a = active !== null ? points[active] : null;

  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <button type="button" className="text-xs text-accent-soft underline" onClick={() => setTable((t) => !t)}>
          {table ? "ดูเป็นกราฟ" : "ดูเป็นตาราง"}
        </button>
      </div>
      {table ? (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted">
              <th className="py-1 font-medium">ตอน</th>
              <th className="py-1 font-medium">ชื่อตอน</th>
              <th className="py-1 text-right font-medium">ความตึงเครียด</th>
            </tr>
          </thead>
          <tbody>
            {points.map((p) => (
              <tr key={p.chapterId} className="border-t border-white/5">
                <td className="py-1">{p.order}</td>
                <td className="py-1">{titleOf(p.chapterId)}</td>
                <td className="py-1 text-right tabular-nums">{p.tension ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="relative">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="w-full touch-pan-y"
            role="img"
            aria-label="กราฟความตึงเครียดตามตอน"
            onPointerMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const px = ((e.clientX - rect.left) / rect.width) * W;
              let best = 0;
              points.forEach((_, i) => {
                if (Math.abs(x(i) - px) < Math.abs(x(best) - px)) best = i;
              });
              setActive(best);
            }}
            onPointerLeave={(e) => e.pointerType === "mouse" && setActive(null)}
          >
            {[1, 5, 10].map((t) => (
              <g key={t}>
                <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke="currentColor" className="text-white/10" strokeWidth={1} />
                <text x={PAD.left - 6} y={y(t) + 4} textAnchor="end" className="fill-muted text-[11px]">
                  {t}
                </text>
              </g>
            ))}
            {points.map((p, i) =>
              i % labelEvery === 0 || i === points.length - 1 ? (
                <text key={p.chapterId} x={x(i)} y={H - 8} textAnchor="middle" className="fill-muted text-[11px]">
                  {p.order}
                </text>
              ) : null,
            )}
            {active !== null && <line x1={x(active)} x2={x(active)} y1={PAD.top} y2={PAD.top + innerH} className="stroke-white/30" strokeWidth={1} />}
            {segments.map((d) => (
              <path key={d} d={d} fill="none" stroke={LINE} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
            ))}
            {points.map((p, i) =>
              p.tension === null ? null : (
                <circle
                  key={p.chapterId}
                  cx={x(i)}
                  cy={y(p.tension)}
                  r={active === i ? 6 : 4.5}
                  fill={LINE}
                  stroke="var(--color-surface)"
                  strokeWidth={2}
                />
              ),
            )}
          </svg>
          {a && (
            <div
              role="status"
              className="pointer-events-none absolute top-0 -translate-x-1/2 rounded-lg bg-surface-2 px-2.5 py-1.5 text-xs shadow-lg ring-1 ring-white/15"
              style={{ left: `clamp(4.5rem, ${(x(active!) / W) * 100}%, calc(100% - 4.5rem))` }}
            >
              <span className="block font-semibold">ตอนที่ {a.order}</span>
              <span className="block max-w-36 truncate text-muted">{titleOf(a.chapterId)}</span>
              <span className="block">ความตึงเครียด: {a.tension ?? "ยังไม่วาง beat"}</span>
            </div>
          )}
        </div>
      )}
      <p className="text-xs text-muted">แกนนอน = ตอน · แกนตั้ง = ความตึงเครียดสูงสุดของ beat ในตอนนั้น (1–10) · เส้นขาด = ตอนที่ยังไม่ได้วาง beat</p>
    </div>
  );
}
