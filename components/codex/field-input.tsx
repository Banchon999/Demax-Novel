"use client";

import { inputClass } from "@/components/ui";
import type { FieldDef } from "@/lib/db/schema";
import { TagInput } from "./tag-input";

const splitTags = (v: string) => v.split(",").map((s) => s.trim()).filter(Boolean);

/** Editor for one custom field; every kind stores a string. */
export function FieldInput({ field, value, onChange }: { field: FieldDef; value: string; onChange: (v: string) => void }) {
  if (field.kind === "tags") {
    return <TagInput label={field.label} value={splitTags(value)} onChange={(tags) => onChange(tags.join(", "))} />;
  }
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-fg/90">{field.label}</span>
      {field.kind === "longtext" ? (
        <textarea className={`${inputClass} field-sizing-content min-h-20`} value={value} onChange={(e) => onChange(e.target.value)} />
      ) : field.kind === "select" ? (
        <select className={inputClass} value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">—</option>
          {(field.options ?? []).filter(Boolean).map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
          {value && !(field.options ?? []).includes(value) && <option value={value}>{value}</option>}
        </select>
      ) : (
        <input
          className={inputClass}
          value={value}
          inputMode={field.kind === "number" ? "decimal" : undefined}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </label>
  );
}

export function FieldValue({ field, value }: { field: FieldDef; value: string }) {
  if (!value) return <span className="text-muted">—</span>;
  if (field.kind === "tags") {
    return (
      <span className="flex flex-wrap gap-1">
        {splitTags(value).map((t) => (
          <span key={t} className="rounded-full bg-white/5 px-2 text-xs">
            {t}
          </span>
        ))}
      </span>
    );
  }
  return <span className="whitespace-pre-line">{value}</span>;
}
