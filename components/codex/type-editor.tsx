"use client";

import { useState } from "react";
import { ArrowDownIcon, ArrowUpIcon, PlusIcon, TrashIcon } from "@/components/icons";
import { Button, ConfirmButton, Field, IconButton, inputClass } from "@/components/ui";
import { createEntityType, deleteEntityType, newField, updateEntityType } from "@/lib/db/codex";
import type { EntityType, FieldDef, FieldKind } from "@/lib/db/schema";

export const TYPE_COLORS = ["#a78bfa", "#38bdf8", "#fbbf24", "#f472b6", "#34d399", "#fb7185", "#f97316", "#94a3b8"];

const KIND_LABELS: Record<FieldKind, string> = {
  text: "ข้อความสั้น",
  longtext: "ข้อความยาว",
  number: "ตัวเลข",
  select: "ตัวเลือก",
  tags: "แท็ก",
};

/** Create or edit a codex type and its custom fields. */
export function TypeEditor({
  projectId,
  type,
  entityCount,
  onDone,
}: {
  projectId: string;
  type: EntityType | null;
  entityCount: number;
  onDone: () => void;
}) {
  const [name, setName] = useState(type?.name ?? "");
  const [icon, setIcon] = useState(type?.icon ?? "📁");
  const [color, setColor] = useState(type?.color ?? TYPE_COLORS[0]);
  const [fields, setFields] = useState<FieldDef[]>(type?.fields ?? []);

  const patchField = (id: string, patch: Partial<FieldDef>) =>
    setFields((fs) => fs.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  const move = (i: number, dir: -1 | 1) =>
    setFields((fs) => {
      const next = [...fs];
      const j = i + dir;
      if (j < 0 || j >= next.length) return fs;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const cleaned = fields.map((f) => ({ ...f, label: f.label.trim() || "ฟิลด์" }));
        if (type) await updateEntityType(type.id, { name: name.trim() || type.name, icon, color, fields: cleaned });
        else {
          const created = await createEntityType(projectId, { name, icon, color });
          await updateEntityType(created.id, { fields: cleaned });
        }
        onDone();
      }}
    >
      <div className="flex gap-2">
        <Field label="ไอคอน">
          <input
            className={`${inputClass} w-16 text-center text-xl`}
            value={icon}
            onChange={(e) => setIcon([...e.target.value].slice(-2).join(""))}
            aria-label="ไอคอน (อีโมจิ)"
          />
        </Field>
        <div className="flex-1">
          <Field label="ชื่อประเภท">
            <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="เช่น สัตว์อสูร, เวทมนตร์, ราชวงศ์" required />
          </Field>
        </div>
      </div>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="สีประจำประเภท">
        {TYPE_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            role="radio"
            aria-checked={color === c}
            aria-label={c}
            onClick={() => setColor(c)}
            className={`size-8 rounded-full ring-offset-2 ring-offset-surface ${color === c ? "ring-2 ring-fg" : ""}`}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">ฟิลด์ข้อมูล</p>
        {fields.length === 0 && <p className="text-xs text-muted">ยังไม่มีฟิลด์ — เพิ่มได้ตามต้องการ</p>}
        {fields.map((f, i) => (
          <div key={f.id} className="space-y-2 rounded-xl bg-surface-2 p-2.5 ring-1 ring-white/5">
            <div className="flex gap-1.5">
              <input
                className={`${inputClass} py-2`}
                value={f.label}
                onChange={(e) => patchField(f.id, { label: e.target.value })}
                aria-label="ชื่อฟิลด์"
              />
              <select
                className={`${inputClass} w-32 py-2 text-sm`}
                value={f.kind}
                onChange={(e) => patchField(f.id, { kind: e.target.value as FieldKind })}
                aria-label="ชนิดฟิลด์"
              >
                {(Object.keys(KIND_LABELS) as FieldKind[]).map((k) => (
                  <option key={k} value={k}>
                    {KIND_LABELS[k]}
                  </option>
                ))}
              </select>
            </div>
            {f.kind === "select" && (
              <input
                className={`${inputClass} py-2 text-sm`}
                value={(f.options ?? []).join(", ")}
                onChange={(e) => patchField(f.id, { options: e.target.value.split(",").map((s) => s.trim()) })}
                onBlur={() => patchField(f.id, { options: (f.options ?? []).filter(Boolean) })}
                placeholder="ตัวเลือก คั่นด้วยจุลภาค เช่น มนุษย์, เอลฟ์, อสูร"
                aria-label="ตัวเลือก"
              />
            )}
            <div className="flex justify-end gap-1">
              <IconButton label="เลื่อนขึ้น" disabled={i === 0} onClick={() => move(i, -1)}>
                <ArrowUpIcon className="size-4" />
              </IconButton>
              <IconButton label="เลื่อนลง" disabled={i === fields.length - 1} onClick={() => move(i, 1)}>
                <ArrowDownIcon className="size-4" />
              </IconButton>
              <IconButton label="ลบฟิลด์" onClick={() => setFields((fs) => fs.filter((x) => x.id !== f.id))}>
                <TrashIcon className="size-4" />
              </IconButton>
            </div>
          </div>
        ))}
        <Button className="w-full" onClick={() => setFields((fs) => [...fs, newField("", "text")])}>
          <PlusIcon className="size-4" /> เพิ่มฟิลด์
        </Button>
      </div>

      <Button type="submit" variant="primary" className="w-full">
        บันทึกประเภท
      </Button>
      {type && (
        <ConfirmButton
          className="w-full"
          confirmLabel={`แตะอีกครั้ง — ลบประเภทนี้และข้อมูล ${entityCount} รายการ`}
          onConfirm={() => deleteEntityType(type.id).then(onDone)}
        >
          ลบประเภทนี้
        </ConfirmButton>
      )}
    </form>
  );
}
