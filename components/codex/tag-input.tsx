"use client";

import { useId, useState } from "react";
import { CloseIcon } from "@/components/icons";


/** Free-form chips: Enter or comma adds, × removes, suggestions below. */
export function TagInput({
  label,
  value,
  onChange,
  suggestions = [],
  placeholder,
}: {
  label: string;
  value: string[];
  onChange: (next: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");
  const listId = useId();
  const add = (raw: string) => {
    const parts = raw.split(/[,，]/).map((s) => s.trim()).filter(Boolean);
    const next = [...value];
    for (const p of parts) if (!next.includes(p)) next.push(p);
    if (next.length !== value.length) onChange(next);
    setDraft("");
  };
  const open = suggestions.filter((s) => !value.includes(s) && (!draft || s.includes(draft.trim()))).slice(0, 8);

  return (
    <div className="space-y-1.5">
      <span className="text-sm font-medium text-fg/90">{label}</span>
      <div className="flex flex-wrap gap-1.5 rounded-xl border border-white/10 bg-surface-2 p-2 focus-within:border-accent">
        {value.map((tag) => (
          <span key={tag} className="flex items-center gap-1 rounded-full bg-accent/20 py-0.5 pl-2.5 pr-1 text-sm text-accent-soft">
            {tag}
            <button
              type="button"
              aria-label={`ลบ ${tag}`}
              className="grid size-5 place-items-center rounded-full hover:bg-white/15"
              onClick={() => onChange(value.filter((t) => t !== tag))}
            >
              <CloseIcon className="size-3" />
            </button>
          </span>
        ))}
        <input
          aria-label={label}
          aria-describedby={listId}
          className="min-w-24 flex-1 bg-transparent px-1 py-1 text-base outline-none placeholder:text-muted/70"
          value={draft}
          placeholder={value.length ? "" : placeholder}
          enterKeyHint="done"
          onChange={(e) => {
            const v = e.target.value;
            if (/[,，]$/.test(v)) add(v);
            else setDraft(v);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.nativeEvent.isComposing) {
              e.preventDefault();
              if (draft.trim()) add(draft);
            } else if (e.key === "Backspace" && !draft && value.length) {
              onChange(value.slice(0, -1));
            }
          }}
          onBlur={() => draft.trim() && add(draft)}
        />
      </div>
      {open.length > 0 && (
        <div id={listId} className="flex flex-wrap gap-1.5">
          {open.map((s) => (
            <button
              key={s}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => add(s)}
              className="rounded-full px-2.5 py-0.5 text-xs text-muted ring-1 ring-white/10 hover:text-fg"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

