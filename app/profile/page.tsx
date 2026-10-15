import type { Metadata } from "next";
import { ChevronRightIcon, ClockIcon, BookIcon, HeartIcon } from "@/components/icons";
import { PageTitle, TopBar } from "@/components/top-bar";

export const metadata: Metadata = { title: "โปรไฟล์" };

const STATS = [
  { icon: BookIcon, value: "1,284", label: "ตอนที่อ่าน" },
  { icon: ClockIcon, value: "96 ชม.", label: "เวลาอ่าน" },
  { icon: HeartIcon, value: "37", label: "เรื่องที่ชอบ" },
];

const FAVORITE_GENRES = [
  { label: "แฟนตาซี", percent: 42 },
  { label: "เกม/ระบบ", percent: 27 },
  { label: "โรแมนติก", percent: 18 },
  { label: "สยองขวัญ", percent: 13 },
];

const SETTINGS = ["การแจ้งเตือน", "การแสดงผลและขนาดตัวอักษร", "ภาษา", "ช่วยเหลือและติดต่อเรา"];

export default function ProfilePage() {
  return (
    <>
      <TopBar>
        <PageTitle>โปรไฟล์</PageTitle>
      </TopBar>
      <main id="main" className="mx-auto max-w-2xl space-y-6 px-4 pt-5 pb-6">
        <section aria-label="ข้อมูลผู้ใช้" className="flex items-center gap-4">
          <div
            aria-hidden="true"
            className="grid size-16 place-items-center rounded-full bg-gradient-to-br from-accent to-fuchsia-500 text-2xl font-bold text-white ring-4 ring-accent/20"
          >
            น
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold">นักอ่านยามดึก</h2>
            <p className="text-sm text-muted">สมาชิกตั้งแต่ มี.ค. 2569</p>
            <p className="mt-1 inline-block rounded-md bg-amber-400/15 px-2 py-0.5 text-xs font-semibold text-amber-300">
              นักอ่านระดับ 12
            </p>
          </div>
        </section>

        <p className="rounded-xl bg-accent/10 px-4 py-3 text-sm text-accent-soft ring-1 ring-accent/20">
          นี่คือโปรไฟล์ตัวอย่าง ระบบสมาชิกจะเปิดให้ใช้งานในเวอร์ชันถัดไป
        </p>

        <section aria-labelledby="stats-heading">
          <h2 id="stats-heading" className="sr-only">
            สถิติการอ่าน
          </h2>
          <dl className="grid grid-cols-3 gap-2.5">
            {STATS.map(({ icon: Icon, value, label }) => (
              <div
                key={label}
                className="flex flex-col items-center gap-1 rounded-2xl bg-surface py-4 ring-1 ring-white/5"
              >
                <Icon className="size-5 text-accent-soft" />
                <dt className="order-last text-xs text-muted">{label}</dt>
                <dd className="text-lg font-bold tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section aria-labelledby="genres-heading" className="rounded-2xl bg-surface p-4 ring-1 ring-white/5">
          <h2 id="genres-heading" className="font-bold">
            หมวดที่อ่านบ่อย
          </h2>
          <ul className="mt-3 space-y-3">
            {FAVORITE_GENRES.map(({ label, percent }) => (
              <li key={label}>
                <div className="flex justify-between text-sm">
                  <span>{label}</span>
                  <span className="tabular-nums text-muted">{percent}%</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${percent}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="settings-heading">
          <h2 id="settings-heading" className="mb-2 font-bold">
            การตั้งค่า
          </h2>
          <ul className="divide-y divide-white/5 overflow-hidden rounded-2xl bg-surface ring-1 ring-white/5">
            {SETTINGS.map((label) => (
              <li key={label} className="flex items-center justify-between px-4 py-3.5 text-sm">
                <span>{label}</span>
                <span className="flex items-center gap-1 text-xs text-muted">
                  เร็ว ๆ นี้
                  <ChevronRightIcon className="size-4" />
                </span>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </>
  );
}
