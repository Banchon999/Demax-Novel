"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { Button, ConfirmButton, inputClass, formatNumber } from "@/components/ui";
import { timeAgo } from "@/lib/dates";
import { db } from "@/lib/db";
import { deleteSnapshot } from "@/lib/db/repo";
import type { Snapshot } from "@/lib/db/schema";
import { chapterPlainText } from "@/lib/text/plain-text";

export function SnapshotsPanel({
  chapterId,
  onCreate,
  onRestore,
}: {
  chapterId: string;
  onCreate: (label: string) => Promise<void>;
  onRestore: (snapshot: Snapshot) => Promise<void>;
}) {
  const snapshots = useLiveQuery(
    () => db.snapshots.where("chapterId").equals(chapterId).reverse().sortBy("createdAt"),
    [chapterId],
  );
  const [label, setLabel] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <form
        className="flex gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          await onCreate(label);
          setLabel("");
        }}
      >
        <input
          className={inputClass}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="ชื่อเวอร์ชัน เช่น ก่อนแก้ฉากต่อสู้"
          aria-label="ชื่อเวอร์ชัน"
        />
        <Button type="submit" variant="primary" className="shrink-0">
          บันทึกเวอร์ชัน
        </Button>
      </form>
      <p className="text-xs text-muted">
        ระบบบันทึกเวอร์ชันอัตโนมัติเมื่อเปิดตอนและทุก 10 นาทีที่มีการแก้ (เก็บ 30 อันล่าสุด) เวอร์ชันที่ตั้งชื่อเองจะไม่ถูกลบ
      </p>
      {snapshots?.length === 0 && <p className="py-6 text-center text-sm text-muted">ยังไม่มีเวอร์ชันที่บันทึกไว้</p>}
      <ul className="space-y-2">
        {snapshots?.map((s) => {
          const expanded = open === s.id;
          return (
            <li key={s.id} className="rounded-xl bg-surface-2 ring-1 ring-white/5">
              <button
                type="button"
                aria-expanded={expanded}
                onClick={() => setOpen(expanded ? null : s.id)}
                className="flex w-full items-center gap-2 p-3 text-left"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">
                    {s.label || (s.auto ? "บันทึกอัตโนมัติ" : "เวอร์ชันที่บันทึกเอง")}
                  </span>
                  <span className="block text-xs text-muted">
                    {timeAgo(s.createdAt)} · {formatNumber(s.wordCount)} คำ
                  </span>
                </span>
                {!s.auto && <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[0.7rem] text-accent-soft">เก็บถาวร</span>}
              </button>
              {expanded && (
                <div className="space-y-3 border-t border-white/5 p-3">
                  <p className="max-h-48 overflow-y-auto whitespace-pre-line text-sm text-fg/80">
                    {chapterPlainText(s.content).slice(0, 1500) || "(ว่าง)"}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <ConfirmButton onConfirm={() => void onRestore(s)} confirmLabel="แตะอีกครั้งเพื่อกู้คืน">
                      กู้คืนเวอร์ชันนี้
                    </ConfirmButton>
                    <Button variant="ghost" onClick={() => void deleteSnapshot(s.id)}>
                      ลบ
                    </Button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
