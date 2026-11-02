# DEMAX Studio — แผนเว็บแอพแต่งนิยายส่วนตัว

## Context
Repo ตอนนี้ (`Demax-Novel`) เป็น frontend **เว็บอ่านนิยาย** (Next.js 16.4, React 19.3, Tailwind 4, mock data, mobile-first, ธีมมืด, bookmark เก็บใน localStorage)
Max อยากได้ **เครื่องมือแต่งนิยายที่ใช้เองคนเดียว** และเน้นมือถือ เพราะเป็นทหารเกณฑ์ เวลาว่างมาเป็นช่วงสั้นๆ ต้องการ 7 ระบบ: หน้าเขียนหลายรูปแบบ, codex + tree line, แท็บองก์/arc, world simulation, AI assistant, export หลายแบบ และ world map generator
เป้าหมายคือ **ลดสิ่งที่ผู้แต่งต้องจำเองหรือรีเสิร์ชเอง** เปิดดูแล้วได้ไอเดีย เขียนต่อได้ทันที

**สิ่งที่ Max ตัดสินใจแล้ว**
- เปลี่ยน repo เป็นแอพแต่ง: เอาหน้าอ่านที่เป็น mock ออก ใช้ดีไซน์และคอมโพเนนต์เดิมต่อ
- เก็บข้อมูล offline-first ในเครื่อง (IndexedDB) มีไฟล์ backup ไว้ย้ายเครื่อง ส่วน cloud sync ทำในเฟสหลัง
- AI ใช้ OpenRouter
- ลำดับการทำตาม roadmap ด้านล่าง

งานใหญ่มาก จึงแบ่งเป็นเฟส **แต่ละเฟสต้องส่งมอบแล้วใช้งานได้จริง** ไม่มีปุ่มหลอกหรือหน้าว่าง เมนูจะโผล่ก็ต่อเมื่อระบบนั้นเสร็จแล้ว
แผนนี้ลงรายละเอียดเฟส 0+1 (รอบแรกที่จะทำ) ส่วนเฟสอื่นเป็น roadmap ที่จะทำ spec แยกเมื่อถึงคิว

## ผลรีเสิร์ช: ฟีเจอร์ที่เพิ่มเข้า roadmap
อ้างอิงจาก Novelcrafter, Sudowrite, Campfire, World Anvil, Aeon Timeline, Plottr, Azgaar FMG, Victoria 3, Ink/Twine/Ren'Py
- **หน้าเขียน**: auto-mention (ชื่อหรือ alias ในเนื้อเรื่องไฮไลต์เอง แตะแล้วเปิดการ์ด), Status Window block สำหรับนิยายเกม/ระบบ, Quick Capture กล่องไอเดีย, เป้าหมายคำ + streak + sprint, snapshot เวอร์ชัน
- **Codex**: สร้างประเภท ฟิลด์ และแท็กเองได้ทั้งหมด, Progressions (ค่าที่เปลี่ยนตามตอน → ดู "สถานะ ณ ตอน X"), กราฟความสัมพันธ์, family tree, timeline หลายเลน + ปฏิทินโลกกำหนดเอง, appearance heatmap
- **องก์/Arc**: template (Save the Cat, Hero's Journey, คิโชเท็นเก็ตสึ, จังหวะ hook ของเว็บนิยาย), กราฟ tension, Foreshadow/Chekhov tracker (ปมที่ปลูกกับตอนเฉลย และเตือนปมที่ยังไม่เก็บ)
- **World sim**: ประชากร/ทรัพยากร/เมือง/เส้นทางค้าขายผูกกับแผนที่, เครื่องคำนวณข้อเท็จจริง offline (กำลังพลเทียบประชากร, อาหาร, เวลาเดินทางจากระยะบนแผนที่), What-if ripple engine ที่แสดงผลเป็นการ์ดคำแนะนำแต่ไม่บังคับเรื่อง, ตลาด supply-demand แบบย่อส่วน
- **AI**: เลือก context อัจฉริยะ (ส่งให้ AI เฉพาะ codex ที่เกี่ยวกับฉาก), ต่อพล็อต, จำลองเส้นเรื่องหลายทาง, สร้างตัวละคร/โลก/เศรษฐกิจ, อ่านข้อมูลโลกแล้วเสนอแนวทาง, ตรวจงาน + continuity check, ปุ่ม "บันทึกเข้า codex"
- **Export**: TXT, MD, HTML, DOCX, EPUB, PDF (print), JSON, copy แบบพร้อมวางเว็บนิยายไทย, VN → Ren'Py `.rpy`, Choice → Twee/Twine
- **แผนที่**: seed → Voronoi → heightmap → ภูมิอากาศ → แม่น้ำ → biome → วัฒนธรรม/รัฐ/เมือง/ถนน, ปุ่มสุ่มใหม่หลายรอบแบบ RimWorld, AI แปลงคำบรรยายเป็นพารามิเตอร์ + ตั้งชื่อ + เขียน lore, เมือง/รัฐส่งเข้า codex และ world sim

## Roadmap
| เฟส | ระบบ |
|---|---|
| **0** ✓ | ฐานระบบ: data model, IndexedDB, studio shell มือถือ, PWA offline, backup/restore |
| **1** ✓ | หน้าเขียน: web novel (prose) + chat novel, autosave, snapshot, เป้าหมาย/streak, Quick Capture |
| 2 ✓ | Codex + tree line (+ auto-mention ในหน้าเขียน, progressions, กราฟ, timeline) |
| 3 ✓ | แท็บองก์/Arc + foreshadow tracker + tension graph |
| 4 ✓ | AI assistant (OpenRouter, **Gemini 3.1 Flash Lite เท่านั้น** ตามที่ Max กำหนด) |
| 5 | Export ทุกรูปแบบ |
| 6 | World map generator |
| 7 | World simulation + what-if |
| 8 | Visual novel + Choice novel editor (+ export Ren'Py/Twine) |
| 9 | Cloud sync (เลือกได้ภายหลัง) |

## เฟส 0+1 — รายละเอียดการทำ

### 0. เตรียม
- `npm install` แล้วอ่าน `node_modules/next/dist/docs/` ตาม AGENTS.md ก่อนเขียนโค้ด โดยเฉพาะ App Router, dynamic routes, `manifest`, PWA/service worker, route handlers และ deprecation
- Dependencies: `dexie`, `dexie-react-hooks`, `@tiptap/react` + `@tiptap/starter-kit` (+ `@tiptap/pm`); dev: `vitest`, `fake-indexeddb`

### 1. เอาส่วนอ่านนิยายออก / ใช้ของเดิมต่อ
- ลบ `app/search/*`, `app/library/*`, `app/novel/*`, `lib/novels.ts`, `lib/library-store.ts`, `components/novel-card.tsx`, `components/bookmark-button.tsx`
- ใช้ต่อ: design tokens ใน `app/globals.css`, `components/top-bar.tsx`, `components/bottom-nav.tsx` (เปลี่ยนเมนู), `components/section-header.tsx`, `components/icons.tsx`, `components/novel-cover.tsx` (ปกโปรเจกต์แบบไล่สี)
- แก้ `app/layout.tsx`: metadata เป็น "DEMAX Studio" (ส่วน font, viewport, safe-area ใช้ของเดิม)

### 2. Data layer (`lib/db/`)
- `schema.ts` (types) + `index.ts` (Dexie มี schema version เพื่อรองรับ migration)
  - `Project` {id, title, synopsis, cover:[c1,c2], defaultFormat, dailyGoal, createdAt, updatedAt}
  - `Chapter` {id, projectId, order, title, format:`prose|chat` (มี `vn|choice` สำรองไว้เฟส 8), content (TipTap JSON หรือ ChatContent), wordCount, status:`draft|done`, updatedAt}
  - `ChatContent` {cast:[{id,name,color,side:`left|right`}], messages:[{id,castId|null,kind:`msg|narration|system`,text}]} (cast จะผูกกับ codex ในเฟส 2)
  - `Snapshot` {id, chapterId, content, wordCount, label, createdAt}
  - `Idea` {id, projectId|null, text, pinned, createdAt}
  - `WritingDay` {key:`projectId:YYYY-MM-DD`, words}
  - ตาราง `EntityType` / `Entity` / `Link` ประกาศ schema ไว้ตั้งแต่ตอนนี้ เพื่อไม่ต้อง migrate ใหญ่ในเฟส 2 แต่ยังไม่มี UI
- `repo.ts`: ฟังก์ชัน CRUD ล้วน (createProject, reorderChapters, saveChapter → อัปเดต wordCount + WritingDay delta ฯลฯ)
- `backup.ts`: export/import JSON ทั้งหมดหรือรายโปรเจกต์ (มี format version และ validate ก่อน import)
- `lib/text/wordcount.ts`: นับคำไทยด้วย `Intl.Segmenter('th',{granularity:'word'})` นับเฉพาะ `isWordLike` และนับตัวอักษรด้วย

### 3. Routes / หน้า
- `/` รายการโปรเจกต์ + สร้างโปรเจกต์ + การ์ดสรุป (คำวันนี้/เป้า, streak)
- `/project?id=…` สารบัญตอน: เพิ่ม/เรียงลำดับ/เปลี่ยนสถานะ, เลือกรูปแบบตอน (prose/chat)
- `/write?id=…` หน้าเขียน
- (ใช้ query param แทน dynamic route: ทุกหน้าเป็น static shell เดียว ทำให้ service worker cache ได้ครบ และเปิด offline ได้ทุกตอน)
- `/ideas` Quick Capture (ผูกกับโปรเจกต์หรือไม่ผูกก็ได้)
- `/settings` backup/restore, ขนาดตัวอักษร, เป้าหมายคำ
- Bottom nav: โปรเจกต์ · ไอเดีย · ตั้งค่า (ซ่อนตอนอยู่หน้าเขียนเพื่อให้มีพื้นที่)
- ทั้งหมดเป็น client components อ่านข้อมูลด้วย `useLiveQuery`; อ่าน id ด้วย `useSearchParams` ภายใน `<Suspense>`

### 4. Prose editor (`components/editor/prose-editor.tsx`)
- TipTap StarterKit: ตัวหนา/เอียง, หัวข้อ, เส้นคั่นฉาก, quote
- Toolbar ลอยติดเหนือคีย์บอร์ดมือถือ (`visualViewport`), focus mode, undo/redo
- Autosave แบบ debounce ~800ms ลง IndexedDB และมีตัวบอกสถานะ "บันทึกแล้ว"
- แถบล่างแสดงคำ/ตัวอักษรของตอน และความคืบหน้าเป้าวันนี้
- Snapshot อัตโนมัติเมื่อเปิดตอนและทุก 10 นาทีที่มีการแก้ (เก็บ 30 ล่าสุด) + กดสร้างเองได้ + ดู/กู้คืนได้

### 5. Chat novel editor (`components/editor/chat-editor.tsx`)
- จัดการ cast: ชื่อ สี ฝั่งซ้าย/ขวา
- พิมพ์เร็วแบบแอพแชท: แตะชิปผู้พูด → พิมพ์ → Enter ส่ง และผู้พูดค้างไว้ให้ ทำให้พิมพ์ต่อเนื่องได้
- ชนิดข้อความ: ข้อความ / บรรยาย / ระบบ; แตะข้อความเพื่อแก้ ลบ เปลี่ยนผู้พูด หรือแทรกข้อความก่อน/หลัง; เลื่อนขึ้นลงได้
- ใช้ autosave, snapshot และ wordcount ชุดเดียวกับ prose

### 6. PWA / offline
- `app/manifest.ts` + `public/sw.js` เขียนเอง (pages network-first, `/_next/static` cache-first) ตาม guide ใน Next docs ให้ติดตั้งลงหน้าจอมือถือและเปิดได้แม้ไม่มีเน็ต
- ขอ `navigator.storage.persist()` เพื่อกันเบราว์เซอร์ล้างข้อมูล และเตือนให้ backup ถ้าไม่ได้ backup เกิน 7 วัน

### 7. ไฟล์ spec
- เมื่อแผนนี้ได้รับอนุมัติ ให้บันทึกเป็น `docs/superpowers/specs/2026-11-02-demax-studio-design.md` แล้ว commit
- เฟสถัดไปแต่ละเฟสได้ spec ของตัวเอง

## Verification
- Unit (vitest + fake-indexeddb): wordcount ไทย, `saveChapter` อัปเดต WritingDay ถูก, backup แบบ export → import แล้วข้อมูลตรงกัน, import ไฟล์เสียแล้ว reject ได้
- `npm run lint` และ `npm run build` ต้องผ่าน
- E2E ด้วย Playwright (Chromium ที่ติดตั้งไว้แล้ว) ที่ viewport 390×844:
  1. สร้างโปรเจกต์ → เพิ่มตอน prose → พิมพ์ภาษาไทย → รีเฟรชแล้วข้อความยังอยู่และนับคำถูก
  2. ตอน chat: เพิ่ม cast 2 คน → ส่งข้อความสลับผู้พูด → รีเฟรชแล้วข้อมูลยังอยู่
  3. สร้าง snapshot → แก้ข้อความ → กู้คืน snapshot
  4. Backup → ลบข้อมูล → restore
  5. เปิดแบบ offline (`context.setOffline(true)`) หลังโหลดครั้งแรกแล้วยังใช้งานได้
  - ถ่าย screenshot มือถือส่งให้ Max ดู
- Commit แล้ว push ไปที่ `claude/novel-writing-web-app-095y5j` → เปิด draft PR → subscribe PR activity

## บันทึกการทำเฟส 2–4
- Max สั่ง: “เทสเองได้เลย ส่วน AI กำหนดให้ใช้แค่ Gemini 3.1 Flash Lite เท่านั้น”
- โมเดลล็อกที่เซิร์ฟเวอร์ (`lib/ai/config.ts` → `google/gemini-3.1-flash-lite`) มี unit test ยืนยันว่า client ส่งโมเดลอื่นมาก็ไม่มีผล
- Context ที่ส่งให้ AI: เรื่องย่อ, สารบัญ, ภาค/จังหวะ, ปมที่ยังไม่เฉลย, Codex ที่เกี่ยวข้องกับตอน (สถานะ ณ ตอนนั้น + ความสัมพันธ์), ไทม์ไลน์, ท้ายตอนก่อน, เนื้อหาตอน · จำกัด ~60k ตัวอักษร
- ข้อควรรู้ของ Next 16: หน้าที่ออกไปแล้วถูกซ่อนด้วย `<Activity>` ไม่ได้ unmount → Sheet ต้องปิด `<dialog>` ใน cleanup ไม่งั้นหน้าใหม่จะกดอะไรไม่ได้
