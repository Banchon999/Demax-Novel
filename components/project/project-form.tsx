"use client";

import { useState } from "react";
import type { ChapterFormat, Project } from "@/lib/db/schema";
import { Button, Field, Segmented, inputClass } from "@/components/ui";

export type ProjectFormValues = {
  title: string;
  synopsis: string;
  defaultFormat: ChapterFormat;
  dailyGoal: number;
};

export const FORMAT_OPTIONS: { value: ChapterFormat; label: string }[] = [
  { value: "prose", label: "นิยายปกติ" },
  { value: "chat", label: "แชทโนเวล" },
];

export function ProjectForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial?: Pick<Project, "title" | "synopsis" | "defaultFormat" | "dailyGoal">;
  submitLabel: string;
  onSubmit: (values: ProjectFormValues) => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [synopsis, setSynopsis] = useState(initial?.synopsis ?? "");
  const [format, setFormat] = useState<ChapterFormat>(initial?.defaultFormat ?? "prose");
  const [goal, setGoal] = useState(String(initial?.dailyGoal ?? 1000));

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const dailyGoal = Math.max(0, Math.round(Number(goal) || 0));
        onSubmit({ title, synopsis, defaultFormat: format, dailyGoal });
      }}
    >
      <Field label="ชื่อเรื่อง">
        <input
          className={inputClass}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="เช่น ราชันย์แห่งเงา"
          required
          autoFocus
        />
      </Field>
      <Field label="เรื่องย่อ / แนวคิด (ไม่บังคับ)">
        <textarea
          className={`${inputClass} min-h-24`}
          value={synopsis}
          onChange={(e) => setSynopsis(e.target.value)}
          placeholder="พล็อตคร่าวๆ ไว้เตือนความจำ"
        />
      </Field>
      <div className="space-y-1.5">
        <span className="text-sm font-medium text-fg/90">รูปแบบตอนเริ่มต้น</span>
        <Segmented label="รูปแบบตอนเริ่มต้น" value={format} options={FORMAT_OPTIONS} onChange={setFormat} />
      </div>
      <Field label="เป้าหมายคำต่อวัน" hint="ใส่ 0 ถ้าไม่ต้องการตั้งเป้า">
        <input
          className={inputClass}
          inputMode="numeric"
          value={goal}
          onChange={(e) => setGoal(e.target.value.replace(/\D/g, ""))}
        />
      </Field>
      <Button type="submit" variant="primary" className="w-full">
        {submitLabel}
      </Button>
    </form>
  );
}
