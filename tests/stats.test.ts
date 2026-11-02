import { describe, expect, it } from "vitest";
import { dayKey, streakDays } from "@/lib/dates";

const d = (month: number, day: number) => new Date(2026, month, day, 12);

describe("streakDays", () => {
  it("counts consecutive writing days ending today", () => {
    const days = new Set([dayKey(d(10, 2)), dayKey(d(10, 1)), dayKey(d(9, 31))]);
    expect(streakDays(days, d(10, 2))).toBe(3);
  });

  it("keeps the streak alive when today has no words yet", () => {
    expect(streakDays(new Set([dayKey(d(10, 1)), dayKey(d(9, 31))]), d(10, 2))).toBe(2);
  });

  it("is zero when the last writing day was before yesterday", () => {
    expect(streakDays(new Set([dayKey(d(10, 1))]), d(10, 3))).toBe(0);
  });
});
