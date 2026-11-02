"use client";

import { useEffect, useRef, useState } from "react";
import { DownloadIcon, UploadIcon } from "@/components/icons";
import { TopBar } from "@/components/top-bar";
import { Button, ConfirmButton, Segmented, Sheet } from "@/components/ui";
import { dayKey, timeAgo } from "@/lib/dates";
import {
  BackupError,
  LAST_BACKUP_KEY,
  backupSummary,
  exportAll,
  importBackup,
  parseBackup,
  type Backup,
} from "@/lib/db/backup";
import { setSetting } from "@/lib/db/repo";
import { downloadJson } from "@/lib/download";
import { useSetting, type FontSizeKey } from "@/lib/hooks/use-setting";

type StorageInfo = { persisted: boolean; usage: number; quota: number } | null;

const mb = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

export function SettingsView() {
  const [lastBackup] = useSetting<number>(LAST_BACKUP_KEY, 0);
  const [fontKey, setFontKey] = useSetting<FontSizeKey>("editorFontSize", "m");
  const [storage, setStorage] = useState<StorageInfo>(null);
  const [pending, setPending] = useState<Backup | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!navigator.storage?.estimate) return;
      const [est, persisted] = await Promise.all([
        navigator.storage.estimate(),
        navigator.storage.persisted?.() ?? Promise.resolve(false),
      ]);
      if (alive) setStorage({ persisted, usage: est.usage ?? 0, quota: est.quota ?? 0 });
    })();
    return () => {
      alive = false;
    };
  }, []);

  async function download() {
    const backup = await exportAll();
    downloadJson(backup, `demax-backup-${dayKey(new Date())}.json`);
    await setSetting(LAST_BACKUP_KEY, Date.now());
    setMessage({ ok: true, text: "ดาวน์โหลดไฟล์สำรองแล้ว เก็บไฟล์ไว้ใน Drive หรือส่งเข้าแชทตัวเองเพื่อความปลอดภัย" });
  }

  async function pick(file: File) {
    try {
      setPending(parseBackup(JSON.parse(await file.text())));
    } catch (err) {
      setMessage({
        ok: false,
        text: err instanceof BackupError ? err.message : "อ่านไฟล์ไม่ได้ ไฟล์อาจไม่ใช่ไฟล์สำรองหรือเสียหาย",
      });
    }
  }

  async function restore(mode: "merge" | "replace") {
    if (!pending) return;
    try {
      await importBackup(pending, mode);
      const s = backupSummary(pending);
      setMessage({ ok: true, text: `กู้คืนสำเร็จ: ${s.projects} เรื่อง ${s.chapters} ตอน ${s.ideas} ไอเดีย` });
    } catch {
      setMessage({ ok: false, text: "กู้คืนไม่สำเร็จ ข้อมูลเดิมยังอยู่ครบ" });
    }
    setPending(null);
  }

  const summary = pending ? backupSummary(pending) : null;

  return (
    <>
      <TopBar>
        <h1 className="px-2 text-lg font-bold">ตั้งค่า</h1>
      </TopBar>
      <main id="main" className="mx-auto max-w-2xl space-y-6 px-4 pt-4">
        {message && (
          <p
            role="status"
            className={`rounded-xl p-3 text-sm ring-1 ${
              message.ok ? "bg-emerald-500/10 text-emerald-200 ring-emerald-500/30" : "bg-red-500/10 text-red-200 ring-red-500/30"
            }`}
          >
            {message.text}
          </p>
        )}

        <section aria-labelledby="backup-heading" className="space-y-3 rounded-2xl bg-surface p-4 ring-1 ring-white/5">
          <h2 id="backup-heading" className="font-bold">
            สำรองและย้ายข้อมูล
          </h2>
          <p className="text-sm text-muted">
            งานทั้งหมดเก็บอยู่ในเครื่องนี้ (ใช้ได้แม้ไม่มีเน็ต) ดาวน์โหลดไฟล์สำรองไว้เป็นประจำ และใช้ไฟล์นี้ย้ายไปเครื่องอื่นได้
          </p>
          <p className="text-sm">
            สำรองล่าสุด: <span className="font-semibold">{lastBackup ? timeAgo(lastBackup) : "ยังไม่เคย"}</span>
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button variant="primary" onClick={download}>
              <DownloadIcon className="size-4" /> ดาวน์โหลดไฟล์สำรองทั้งหมด
            </Button>
            <Button onClick={() => fileRef.current?.click()}>
              <UploadIcon className="size-4" /> กู้คืนจากไฟล์
            </Button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            aria-label="เลือกไฟล์สำรอง"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void pick(file);
              e.target.value = "";
            }}
          />
        </section>

        <section aria-labelledby="editor-heading" className="space-y-3 rounded-2xl bg-surface p-4 ring-1 ring-white/5">
          <h2 id="editor-heading" className="font-bold">
            หน้าเขียน
          </h2>
          <div className="space-y-1.5">
            <span className="text-sm text-fg/90">ขนาดตัวอักษร</span>
            <Segmented
              label="ขนาดตัวอักษร"
              value={fontKey}
              onChange={setFontKey}
              options={[
                { value: "s", label: "เล็ก" },
                { value: "m", label: "กลาง" },
                { value: "l", label: "ใหญ่" },
                { value: "xl", label: "ใหญ่มาก" },
              ]}
            />
          </div>
        </section>

        {storage && (
          <section aria-labelledby="storage-heading" className="space-y-1 rounded-2xl bg-surface p-4 text-sm ring-1 ring-white/5">
            <h2 id="storage-heading" className="mb-2 font-bold">
              พื้นที่เก็บข้อมูล
            </h2>
            <p>
              ใช้ไป {mb(storage.usage)} จาก {mb(storage.quota)}
            </p>
            <p className={storage.persisted ? "text-emerald-300" : "text-amber-300"}>
              {storage.persisted
                ? "เบราว์เซอร์ล็อกข้อมูลไว้แล้ว จะไม่ลบเองเมื่อพื้นที่เต็ม"
                : "เบราว์เซอร์อาจลบข้อมูลเองเมื่อพื้นที่เต็ม — ติดตั้งแอพลงหน้าจอโฮม และสำรองข้อมูลเป็นประจำ"}
            </p>
          </section>
        )}

        <p className="pb-4 text-center text-xs text-muted">DEMAX Studio · เฟส 1</p>
      </main>

      <Sheet open={pending !== null} onClose={() => setPending(null)} title="กู้คืนข้อมูล">
        {summary && pending && (
          <div className="space-y-3">
            <p className="text-sm">
              ไฟล์นี้มี <b>{summary.projects}</b> เรื่อง <b>{summary.chapters}</b> ตอน <b>{summary.ideas}</b> ไอเดีย
              {pending.exportedAt > 0 && <> (สำรองเมื่อ {timeAgo(pending.exportedAt)})</>}
            </p>
            <Button variant="primary" className="w-full" onClick={() => restore("merge")}>
              รวมกับข้อมูลในเครื่อง
            </Button>
            <p className="text-xs text-muted">ข้อมูลที่ซ้ำกันจะใช้ของในไฟล์ ข้อมูลอื่นในเครื่องยังอยู่</p>
            {!pending.projectId && (
              <>
                <ConfirmButton
                  className="w-full"
                  confirmLabel="แตะอีกครั้ง — ลบข้อมูลในเครื่องแล้วแทนที่"
                  onConfirm={() => void restore("replace")}
                >
                  แทนที่ข้อมูลทั้งหมดในเครื่อง
                </ConfirmButton>
                <p className="text-xs text-muted">ลบทุกอย่างในเครื่องนี้แล้วใช้ข้อมูลจากไฟล์แทน</p>
              </>
            )}
          </div>
        )}
      </Sheet>
    </>
  );
}
