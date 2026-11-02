# DEMAX Studio

เครื่องมือแต่งนิยายส่วนตัวสำหรับมือถือ ข้อมูลทั้งหมดเก็บในเครื่อง (IndexedDB) ใช้งานได้แม้ไม่มีเน็ต และติดตั้งลงหน้าจอโฮมได้แบบ PWA

แผนทั้งหมดและ roadmap อยู่ที่ [`docs/superpowers/specs/2026-11-02-demax-studio-design.md`](docs/superpowers/specs/2026-11-02-demax-studio-design.md)

## สิ่งที่มีตอนนี้ (เฟส 0+1)

- **เรื่อง / สารบัญ** — สร้างเรื่อง, เพิ่ม/เรียง/ลบตอน, ทำเครื่องหมายตอนที่เสร็จแล้ว
- **หน้าเขียนนิยายปกติ** — toolbar อยู่เหนือคีย์บอร์ด (ตัวหนา เอียง หัวข้อ quote เส้นคั่นฉาก undo/redo), โหมดโฟกัส, ปรับขนาดตัวอักษรได้
- **หน้าเขียนแชทโนเวล** — กำหนดสีและฝั่งของตัวละครได้, มีข้อความแบบบรรยายและแบบระบบ, แตะข้อความเพื่อแก้ ย้าย หรือแทรกข้อความ
- **บันทึกอัตโนมัติ + ประวัติเวอร์ชัน** — เก็บเวอร์ชันเองเมื่อเปิดตอนและทุก 10 นาที, ตั้งชื่อเวอร์ชันเองได้, กู้คืนได้
- **นับคำภาษาไทยได้ถูก** (`Intl.Segmenter`), เป้าหมายคำต่อวัน, streak, ปุ่ม "เขียนต่อจากล่าสุด"
- **กล่องไอเดีย** — จดไอเดียผูกกับเรื่องได้, ปักหมุดได้, พูดแทนพิมพ์ได้ (Chrome บน Android)
- **สำรอง/กู้คืน** — เป็นไฟล์ JSON ใช้ย้ายเครื่องได้ เลือกได้ว่าจะรวมกับข้อมูลเดิมหรือแทนที่ทั้งหมด

## พัฒนา

```bash
npm install
npm run dev        # http://localhost:3000 (service worker ทำงานเฉพาะ production)
npm test           # unit tests (vitest + fake-indexeddb)
npm run lint
npm run build && npx next start -p 3100
BASE_URL=http://localhost:3100 npm run e2e   # Playwright smoke test ที่ขนาดจอมือถือ
```

## โครงสร้าง

- `lib/db/` — schema, Dexie database, repository functions, backup
- `lib/text/` — นับคำ และแปลงเนื้อหาเป็น plain text
- `lib/hooks/` — autosave, visual viewport (ตำแหน่งคีย์บอร์ด), settings, speech
- `components/write/` — prose editor (TipTap), chat editor, ประวัติเวอร์ชัน
- `public/sw.js` — service worker สำหรับใช้งาน offline
