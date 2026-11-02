"use client";

import Link from "next/link";

export type ProjectTab = "chapters" | "codex" | "timeline" | "graph" | "plot" | "ai";

const TABS: { key: ProjectTab; label: string; href: (id: string) => string }[] = [
  { key: "chapters", label: "สารบัญ", href: (id) => `/project?id=${id}` },
  { key: "codex", label: "Codex", href: (id) => `/codex?p=${id}` },
  { key: "plot", label: "พล็อต", href: (id) => `/plot?p=${id}` },
  { key: "timeline", label: "ไทม์ไลน์", href: (id) => `/timeline?p=${id}` },
  { key: "graph", label: "ความสัมพันธ์", href: (id) => `/graph?p=${id}` },
  { key: "ai", label: "ผู้ช่วย AI", href: (id) => `/ai?p=${id}` },
];

/** Sub-navigation shared by every page that belongs to one project. */
export function ProjectNav({ projectId, active }: { projectId: string; active: ProjectTab }) {
  return (
    <nav aria-label="ส่วนของเรื่อง" className="sticky top-14 z-20 border-b border-white/5 bg-bg/90 backdrop-blur-lg">
      <ul className="scroller mx-auto flex max-w-2xl gap-1 overflow-x-auto px-3 py-2">
        {TABS.map((t) => (
          <li key={t.key} className="shrink-0">
            <Link
              href={t.href(projectId)}
              aria-current={t.key === active ? "page" : undefined}
              className={`block rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                t.key === active ? "bg-accent text-white" : "text-fg/75 hover:bg-white/10 hover:text-fg"
              }`}
            >
              {t.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
