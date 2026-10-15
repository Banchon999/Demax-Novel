export type GenreId =
  | "fantasy"
  | "romance"
  | "wuxia"
  | "game"
  | "isekai"
  | "mystery"
  | "horror"
  | "scifi"
  | "slice";

export type Genre = { id: GenreId; label: string };

export const GENRES: Genre[] = [
  { id: "fantasy", label: "แฟนตาซี" },
  { id: "romance", label: "โรแมนติก" },
  { id: "wuxia", label: "กำลังภายใน" },
  { id: "game", label: "เกม/ระบบ" },
  { id: "isekai", label: "ต่างโลก" },
  { id: "mystery", label: "สืบสวน" },
  { id: "horror", label: "สยองขวัญ" },
  { id: "scifi", label: "ไซไฟ" },
  { id: "slice", label: "ชีวิตประจำวัน" },
];

const GENRE_LABELS = Object.fromEntries(
  GENRES.map((g) => [g.id, g.label]),
) as Record<GenreId, string>;

export function genreLabel(id: GenreId): string {
  return GENRE_LABELS[id];
}

export function isGenreId(value: string | null): value is GenreId {
  return value !== null && value in GENRE_LABELS;
}

export type NovelStatus = "ongoing" | "completed";

export type Novel = {
  id: string;
  title: string;
  author: string;
  genres: GenreId[];
  tags: string[];
  synopsis: string;
  status: NovelStatus;
  chapters: number;
  /** Total all-time reads. */
  views: number;
  /** Reads in the last 7 days. */
  weeklyViews: number;
  /** Week-over-week read growth, in percent. */
  growth: number;
  likes: number;
  rating: number;
  /** ISO date of the latest chapter. */
  updatedAt: string;
  /** Two gradient stops for the generated cover. */
  cover: [string, string];
};

export const NOVELS: Novel[] = [
  {
    id: "dragon-sovereign",
    title: "ราชันย์มังกรเหนือนภา",
    author: "ฟ้าคราม",
    genres: ["fantasy", "wuxia"],
    tags: ["มังกร", "ผู้กล้า", "ไต่ระดับ"],
    synopsis:
      "เด็กหนุ่มจากหมู่บ้านชายแดนได้รับเศษเกล็ดมังกรโบราณที่ปลุกพลังซึ่งหลับใหลมาพันปี เขาต้องเลือกระหว่างการปกป้องคนที่รัก หรือกลายเป็นราชันย์ที่โลกทั้งใบหวาดกลัว",
    status: "ongoing",
    chapters: 842,
    views: 12_480_000,
    weeklyViews: 386_000,
    growth: 6,
    likes: 412_000,
    rating: 4.8,
    updatedAt: "2026-10-14",
    cover: ["#7c3aed", "#1e1b4b"],
  },
  {
    id: "ordinary-system",
    title: "ระบบเทพเซียนกับคนธรรมดา",
    author: "หมึกจาง",
    genres: ["game", "fantasy"],
    tags: ["ระบบ", "ตลก", "พระเอกเทพ"],
    synopsis:
      "พนักงานออฟฟิศธรรมดาตื่นมาพบหน้าต่างระบบลอยอยู่ตรงหน้า ภารกิจแรกคือ 'ล้างจานให้ครบร้อยใบ' แต่รางวัลกลับเป็นวิชาเซียนที่ทำให้ทั้งยุทธภพสั่นสะเทือน",
    status: "ongoing",
    chapters: 615,
    views: 9_870_000,
    weeklyViews: 452_000,
    growth: 18,
    likes: 356_000,
    rating: 4.7,
    updatedAt: "2026-10-15",
    cover: ["#0ea5e9", "#0c1a3a"],
  },
  {
    id: "villainess-princess",
    title: "ข้ามมิติไปเป็นเจ้าหญิงตัวร้าย",
    author: "ซากุระสีเทา",
    genres: ["isekai", "romance"],
    tags: ["ข้ามมิติ", "ตัวร้าย", "ราชสำนัก"],
    synopsis:
      "ตื่นมาอีกทีก็กลายเป็นเจ้าหญิงตัวร้ายในนิยายที่อ่านค้างไว้ ซึ่งถูกกำหนดให้ตายในบทที่สาม เธอจึงต้องเปลี่ยนชะตาก่อนที่ดาบของพระเอกจะมาถึง",
    status: "ongoing",
    chapters: 298,
    views: 8_240_000,
    weeklyViews: 298_000,
    growth: 9,
    likes: 388_000,
    rating: 4.9,
    updatedAt: "2026-10-13",
    cover: ["#ec4899", "#3b0a2a"],
  },
  {
    id: "nine-heavens-blade",
    title: "ดาบพิฆาตเก้าสวรรค์",
    author: "ลมเหนือ",
    genres: ["wuxia"],
    tags: ["ยุทธภพ", "แก้แค้น", "สำนักดาบ"],
    synopsis:
      "ศิษย์คนสุดท้ายของสำนักที่ถูกล้างบางแบกดาบหักเพียงเล่มเดียวออกเดินทาง เพื่อทวงคืนเก้าเคล็ดวิชาที่ถูกขโมยไปพร้อมกับความจริงของคืนนั้น",
    status: "completed",
    chapters: 1204,
    views: 7_610_000,
    weeklyViews: 142_000,
    growth: -3,
    likes: 251_000,
    rating: 4.6,
    updatedAt: "2026-08-02",
    cover: ["#b91c1c", "#1c0a0a"],
  },
  {
    id: "last-sss-player",
    title: "ผู้เล่นระดับ SSS คนสุดท้าย",
    author: "Pixel_K",
    genres: ["game", "scifi"],
    tags: ["เกมออนไลน์", "ดันเจี้ยน", "ย้อนเวลา"],
    synopsis:
      "เมื่อเกมเสมือนจริงกลายเป็นโลกจริง ผู้เล่นอันดับหนึ่งที่ตายในเควสต์สุดท้ายได้ย้อนกลับมาวันเปิดเซิร์ฟเวอร์อีกครั้ง พร้อมความทรงจำของทุกบอสและทุกกับดัก",
    status: "ongoing",
    chapters: 477,
    views: 6_930_000,
    weeklyViews: 401_000,
    growth: 24,
    likes: 289_000,
    rating: 4.7,
    updatedAt: "2026-10-15",
    cover: ["#22c55e", "#052e16"],
  },
  {
    id: "endless-love",
    title: "รักนี้ไม่มีบทสรุป",
    author: "ดาวเดือน",
    genres: ["romance", "slice"],
    tags: ["รักวัยทำงาน", "ดราม่า", "หวานซึ้ง"],
    synopsis:
      "นักเขียนบทละครที่ไม่เคยเขียนตอนจบได้สักเรื่อง ต้องร่วมงานกับผู้กำกับคนรักเก่า ทั้งคู่จึงต้องตัดสินใจว่าเรื่องราวของพวกเขาจะจบอย่างไร",
    status: "completed",
    chapters: 156,
    views: 5_420_000,
    weeklyViews: 96_000,
    growth: 2,
    likes: 302_000,
    rating: 4.8,
    updatedAt: "2026-06-21",
    cover: ["#f97316", "#431407"],
  },
  {
    id: "night-shift-hunter",
    title: "นักล่าดันเจี้ยนกะดึก",
    author: "ตะเกียงน้ำมัน",
    genres: ["game", "fantasy", "slice"],
    tags: ["ดันเจี้ยน", "ชีวิตคนทำงาน", "ตลก"],
    synopsis:
      "กลางวันเป็นพนักงานร้านสะดวกซื้อ กลางคืนรับจ้างเคลียร์ดันเจี้ยนเล็ก ๆ ที่โผล่ขึ้นในกรุงเทพฯ เพื่อหาเงินจ่ายค่าเช่าห้อง",
    status: "ongoing",
    chapters: 231,
    views: 3_180_000,
    weeklyViews: 352_000,
    growth: 41,
    likes: 158_000,
    rating: 4.6,
    updatedAt: "2026-10-15",
    cover: ["#facc15", "#1f1a05"],
  },
  {
    id: "academy-elementless",
    title: "จอมเวทย์ไร้ธาตุแห่งสถาบันอัลเทีย",
    author: "เงาจันทร์",
    genres: ["fantasy"],
    tags: ["โรงเรียนเวทมนตร์", "ตัวเอกถูกดูถูก", "วางแผน"],
    synopsis:
      "นักเรียนที่ถูกตัดสินว่า 'ไร้ธาตุ' กลับค้นพบว่าเขาสามารถลบล้างเวทมนตร์ทุกชนิดได้ ความลับนี้ทำให้เขากลายเป็นเป้าหมายของทั้งสถาบัน",
    status: "ongoing",
    chapters: 389,
    views: 4_760_000,
    weeklyViews: 214_000,
    growth: 12,
    likes: 197_000,
    rating: 4.7,
    updatedAt: "2026-10-12",
    cover: ["#6366f1", "#111133"],
  },
  {
    id: "library-murder",
    title: "คดีฆาตกรรมในหอสมุดเก่า",
    author: "ปากกาแดง",
    genres: ["mystery"],
    tags: ["ปริศนา", "ห้องปิดตาย", "นักสืบ"],
    synopsis:
      "ศพบรรณารักษ์ถูกพบในห้องหนังสือหายากที่ล็อกจากด้านใน นักศึกษาฝึกงานคนเดียวที่เห็นความผิดปกติ ต้องไขคดีก่อนที่เธอจะกลายเป็นผู้ต้องสงสัยรายต่อไป",
    status: "completed",
    chapters: 88,
    views: 2_310_000,
    weeklyViews: 61_000,
    growth: 5,
    likes: 121_000,
    rating: 4.8,
    updatedAt: "2026-04-30",
    cover: ["#64748b", "#0f172a"],
  },
  {
    id: "basement-whisper",
    title: "เสียงกระซิบจากชั้นใต้ดิน",
    author: "ราตรีกาล",
    genres: ["horror", "mystery"],
    tags: ["ผี", "บ้านร้าง", "ระทึก"],
    synopsis:
      "ครอบครัวหนึ่งย้ายเข้าบ้านราคาถูกผิดปกติย่านฝั่งธน ทุกคืนตีสามจะมีเสียงเรียกชื่อลูกสาวคนเล็กดังขึ้นมาจากประตูชั้นใต้ดินที่ไม่มีใครเปิดได้",
    status: "ongoing",
    chapters: 64,
    views: 1_870_000,
    weeklyViews: 233_000,
    growth: 57,
    likes: 96_000,
    rating: 4.5,
    updatedAt: "2026-10-14",
    cover: ["#475569", "#020617"],
  },
  {
    id: "probe-zero",
    title: "ยานสำรวจหมายเลขศูนย์",
    author: "ดวงดาวเที่ยงคืน",
    genres: ["scifi"],
    tags: ["อวกาศ", "ปัญญาประดิษฐ์", "เอาชีวิตรอด"],
    synopsis:
      "ลูกเรือเพียงคนเดียวที่ตื่นจากการจำศีลก่อนกำหนดสามร้อยปี มีเพียง AI ประจำยานที่โกหกเก่งขึ้นทุกวันเป็นเพื่อน",
    status: "ongoing",
    chapters: 142,
    views: 1_240_000,
    weeklyViews: 118_000,
    growth: 33,
    likes: 64_000,
    rating: 4.7,
    updatedAt: "2026-10-11",
    cover: ["#06b6d4", "#042f2e"],
  },
  {
    id: "after-school-cafe",
    title: "ร้านกาแฟหลังเลิกเรียน",
    author: "น้ำผึ้งมะนาว",
    genres: ["slice", "romance"],
    tags: ["ฮีลใจ", "วัยเรียน", "อบอุ่น"],
    synopsis:
      "ร้านกาแฟเล็ก ๆ หน้าโรงเรียนที่เปิดเฉพาะหลังสี่โมงเย็น เจ้าของร้านวัยยี่สิบปีกับเด็กนักเรียนขาประจำที่ไม่เคยสั่งเมนูเดิมซ้ำ",
    status: "ongoing",
    chapters: 97,
    views: 980_000,
    weeklyViews: 87_000,
    growth: 21,
    likes: 72_000,
    rating: 4.9,
    updatedAt: "2026-10-10",
    cover: ["#a16207", "#1c1306"],
  },
  {
    id: "general-reborn",
    title: "คืนชีพเป็นแม่ทัพหญิง",
    author: "หลิวเฟิง",
    genres: ["isekai", "wuxia", "romance"],
    tags: ["เกิดใหม่", "สงคราม", "นางเอกเก่ง"],
    synopsis:
      "แม่ทัพหญิงที่ถูกใส่ร้ายจนตายลืมตาขึ้นอีกครั้งในวันก่อนการแต่งงานที่ทำลายชีวิตเธอ ครั้งนี้เธอจะไม่ยอมเป็นหมากของใครอีก",
    status: "ongoing",
    chapters: 344,
    views: 5_980_000,
    weeklyViews: 274_000,
    growth: 15,
    likes: 267_000,
    rating: 4.8,
    updatedAt: "2026-10-14",
    cover: ["#be123c", "#2a0612"],
  },
  {
    id: "cold-ceo",
    title: "ประธานเย็นชากับเลขาตัวป่วน",
    author: "ชาไทยหวานน้อย",
    genres: ["romance"],
    tags: ["ออฟฟิศ", "ตลก", "หวานเจี๊ยบ"],
    synopsis:
      "เลขาที่ทำกาแฟหกใส่ประธานบริษัทในวันแรก กลับได้รับการต่อสัญญาอย่างไม่มีใครเข้าใจ ยกเว้นตัวประธานเองที่ไม่ยอมบอกเหตุผล",
    status: "completed",
    chapters: 120,
    views: 4_120_000,
    weeklyViews: 73_000,
    growth: -6,
    likes: 233_000,
    rating: 4.5,
    updatedAt: "2026-02-14",
    cover: ["#db2777", "#1f0718"],
  },
  {
    id: "bangkok-exorcist",
    title: "บันทึกหมอผีแห่งบางกอก",
    author: "ขุนเทียน",
    genres: ["horror", "mystery"],
    tags: ["ไสยศาสตร์", "เมืองเก่า", "คดีลึกลับ"],
    synopsis:
      "หมอผีรุ่นที่สามที่อยากเป็นแค่โปรแกรมเมอร์ ต้องรับคดีวิญญาณแปลก ๆ ทั่วกรุงเทพฯ ที่ตำรวจไม่ยอมรับแจ้งความ",
    status: "ongoing",
    chapters: 176,
    views: 2_640_000,
    weeklyViews: 189_000,
    growth: 28,
    likes: 118_000,
    rating: 4.7,
    updatedAt: "2026-10-13",
    cover: ["#15803d", "#03140a"],
  },
  {
    id: "last-star-war",
    title: "สงครามดวงดาวครั้งสุดท้าย",
    author: "ธนูเหล็ก",
    genres: ["scifi"],
    tags: ["สงคราม", "ยานรบ", "การเมือง"],
    synopsis:
      "นักบินฝึกหัดจากดาวเหมืองแร่ถูกเกณฑ์เข้าสงครามที่ดำเนินมาสามชั่วอายุคน และพบว่าศัตรูพูดภาษาเดียวกับคุณยายของเขา",
    status: "completed",
    chapters: 312,
    views: 3_390_000,
    weeklyViews: 58_000,
    growth: -2,
    likes: 141_000,
    rating: 4.6,
    updatedAt: "2026-03-09",
    cover: ["#2563eb", "#0a1433"],
  },
  {
    id: "nameless-sword",
    title: "ตำนานกระบี่ไร้นาม",
    author: "ลมเหนือ",
    genres: ["wuxia", "fantasy"],
    tags: ["ยุทธภพ", "ปรมาจารย์", "ภาคต่อ"],
    synopsis:
      "ภาคต่อของดาบพิฆาตเก้าสวรรค์ ยี่สิบปีหลังศึกครั้งใหญ่ กระบี่ที่ไม่มีใครรู้จักชื่อเริ่มสังหารเจ้าสำนักทีละคน",
    status: "ongoing",
    chapters: 203,
    views: 2_870_000,
    weeklyViews: 247_000,
    growth: 36,
    likes: 129_000,
    rating: 4.7,
    updatedAt: "2026-10-15",
    cover: ["#c2410c", "#1c0b04"],
  },
  {
    id: "cute-ghost-dorm",
    title: "หอพักนี้มีผีน่ารัก",
    author: "มะลิซ้อน",
    genres: ["slice", "horror"],
    tags: ["ตลก", "ฮีลใจ", "ผีไม่น่ากลัว"],
    synopsis:
      "นักศึกษาปีหนึ่งเช่าห้องราคาถูกที่สุดในหอ และพบว่ามีรูมเมทเป็นผีสาวยุค 90 ที่ติดซีรีส์และชอบแย่งรีโมต",
    status: "ongoing",
    chapters: 78,
    views: 760_000,
    weeklyViews: 104_000,
    growth: 48,
    likes: 58_000,
    rating: 4.8,
    updatedAt: "2026-10-12",
    cover: ["#8b5cf6", "#1d1033"],
  },
  {
    id: "village-alchemist",
    title: "เกิดใหม่เป็นนักปรุงยาบ้านนอก",
    author: "ใบชาเขียว",
    genres: ["isekai", "slice", "fantasy"],
    tags: ["เกิดใหม่", "ทำฟาร์ม", "สโลว์ไลฟ์"],
    synopsis:
      "เภสัชกรที่ทำงานหนักจนตายได้เกิดใหม่ในหมู่บ้านห่างไกล เขาตั้งใจจะใช้ชีวิตช้า ๆ ปลูกสมุนไพร แต่ยาธรรมดาของเขากลับรักษาได้แม้กระทั่งคำสาป",
    status: "ongoing",
    chapters: 265,
    views: 3_720_000,
    weeklyViews: 168_000,
    growth: 11,
    likes: 176_000,
    rating: 4.8,
    updatedAt: "2026-10-11",
    cover: ["#16a34a", "#0b1f10"],
  },
  {
    id: "sky-city-cipher",
    title: "รหัสลับใต้เมืองฟ้า",
    author: "นิลกาฬ",
    genres: ["mystery", "scifi"],
    tags: ["ไซเบอร์พังก์", "แฮกเกอร์", "สมคบคิด"],
    synopsis:
      "ในเมืองลอยฟ้าที่ทุกคนมีชิปประจำตัว แฮกเกอร์สาวพบข้อความเข้ารหัสที่ส่งมาจากตัวเธอเองในอนาคต พร้อมรายชื่อคนที่จะหายตัวไป",
    status: "ongoing",
    chapters: 119,
    views: 1_460_000,
    weeklyViews: 141_000,
    growth: 29,
    likes: 77_000,
    rating: 4.6,
    updatedAt: "2026-10-09",
    cover: ["#d946ef", "#1a0620"],
  },
];

export function getNovel(id: string): Novel | undefined {
  return NOVELS.find((n) => n.id === id);
}

/** All-time most read. */
export function getPopular(limit = 10): Novel[] {
  return [...NOVELS].sort((a, b) => b.views - a.views).slice(0, limit);
}

/** Fastest growing this week, weighted by weekly reads so tiny titles don't dominate. */
export function trendScore(novel: Novel): number {
  return novel.weeklyViews * (1 + novel.growth / 100);
}

export function getTrending(limit = 8): Novel[] {
  return [...NOVELS]
    .filter((n) => n.growth > 0)
    .sort((a, b) => trendScore(b) - trendScore(a))
    .slice(0, limit);
}

export function formatCount(value: number): string {
  if (value >= 1_000_000) return `${trimZero((value / 1_000_000).toFixed(1))}M`;
  if (value >= 1_000) return `${trimZero((value / 1_000).toFixed(1))}K`;
  return String(value);
}

function trimZero(s: string): string {
  return s.endsWith(".0") ? s.slice(0, -2) : s;
}

const dateFormatter = new Intl.DateTimeFormat("th-TH", {
  day: "numeric",
  month: "short",
  year: "2-digit",
  timeZone: "Asia/Bangkok",
});

export function formatDate(iso: string): string {
  return dateFormatter.format(new Date(`${iso}T00:00:00+07:00`));
}

export const STATUS_LABELS: Record<NovelStatus, string> = {
  ongoing: "กำลังอัปเดต",
  completed: "จบแล้ว",
};
