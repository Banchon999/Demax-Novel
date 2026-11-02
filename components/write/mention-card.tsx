"use client";

import Link from "next/link";
import { CloseIcon } from "@/components/icons";
import { IconButton } from "@/components/ui";
import { stateAt } from "@/lib/codex/state";
import type { Entity, EntityType } from "@/lib/db/schema";

/**
 * Peek at a codex entry without leaving the page. Not a modal, so the
 * keyboard and the caret stay where they were.
 */
export function MentionCard({
  entity,
  type,
  chapterOrder,
  atOrder,
  onClose,
}: {
  entity: Entity;
  type?: EntityType;
  chapterOrder: Map<string, number>;
  atOrder: number;
  onClose: () => void;
}) {
  const state = stateAt(entity, chapterOrder, atOrder);
  const filled = (type?.fields ?? []).filter((f) => state[f.id]?.value).slice(0, 6);
  return (
    <aside
      aria-label={`ข้อมูลของ ${entity.name}`}
      className="mx-2 mb-2 max-h-[40%] shrink-0 overflow-y-auto rounded-2xl bg-surface-2 p-3 shadow-xl ring-1 ring-white/15"
      style={{ boxShadow: `inset 3px 0 0 ${type?.color ?? "#8b5cf6"}` }}
    >
      <div className="flex items-start gap-2">
        <span className="text-xl" aria-hidden="true">
          {type?.icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-bold">{entity.name}</p>
          <p className="text-xs text-muted">
            {type?.name}
            {entity.aliases.length > 0 && ` · ${entity.aliases.join(", ")}`}
          </p>
        </div>
        <IconButton label="ปิด" className="size-8" onClick={onClose}>
          <CloseIcon className="size-4" />
        </IconButton>
      </div>
      {filled.length > 0 ? (
        <dl className="mt-2 grid gap-1 text-sm">
          {filled.map((f) => (
            <div key={f.id} className="grid grid-cols-[6.5rem_1fr] gap-2">
              <dt className="text-muted">{f.label}</dt>
              <dd className="line-clamp-3 whitespace-pre-line">
                {state[f.id].value}
                {state[f.id].sinceOrder && <span className="ml-1 text-[0.7rem] text-accent-soft">(ตอน {state[f.id].sinceOrder})</span>}
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="mt-2 text-sm text-muted">ยังไม่ได้กรอกรายละเอียด</p>
      )}
      {entity.tags.length > 0 && <p className="mt-2 text-xs text-fg/70">{entity.tags.map((t) => `#${t}`).join(" ")}</p>}
      <Link href={`/entity?id=${entity.id}`} className="mt-2 inline-block text-sm font-semibold text-accent-soft underline">
        เปิดใน Codex
      </Link>
    </aside>
  );
}
