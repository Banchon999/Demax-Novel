/** Local-time calendar day as YYYY-MM-DD (not UTC: a day is the writer's day). */
export function dayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addDays(date: Date, n: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + n);
  return next;
}

/**
 * Consecutive days with writing, ending today. A day without words yet does
 * not break the streak until it is over, so counting may start at yesterday.
 */
export function streakDays(writtenDays: ReadonlySet<string>, today: Date): number {
  let cursor = writtenDays.has(dayKey(today)) ? today : addDays(today, -1);
  let streak = 0;
  while (writtenDays.has(dayKey(cursor))) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

const relative = new Intl.RelativeTimeFormat("th", { numeric: "auto" });

export function timeAgo(timestamp: number, now = Date.now()): string {
  const diff = Math.round((timestamp - now) / 1000);
  const abs = Math.abs(diff);
  if (abs < 60) return "เมื่อสักครู่";
  if (abs < 3600) return relative.format(Math.round(diff / 60), "minute");
  if (abs < 86400) return relative.format(Math.round(diff / 3600), "hour");
  if (abs < 86400 * 30) return relative.format(Math.round(diff / 86400), "day");
  return new Date(timestamp).toLocaleDateString("th-TH", { dateStyle: "medium" });
}
