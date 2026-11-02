import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { BackupError, exportAll, importBackup, parseBackup } from "@/lib/db/backup";
import { createChapter, createProject } from "@/lib/db/repo";

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()));
});

describe("backup", () => {
  it("round-trips all data through JSON", async () => {
    const p = await createProject({ title: "สำรอง" });
    await createChapter(p.id, { format: "prose", title: "บทนำ" });
    const json = JSON.stringify(await exportAll());
    await Promise.all(db.tables.map((t) => t.clear()));
    await importBackup(parseBackup(JSON.parse(json)), "replace");
    expect((await db.projects.get(p.id))?.title).toBe("สำรอง");
    expect((await db.chapters.where("projectId").equals(p.id).first())?.title).toBe("บทนำ");
  });

  it("merge mode keeps existing projects", async () => {
    const a = await createProject({ title: "A" });
    const backup = await exportAll();
    await db.projects.delete(a.id);
    await createProject({ title: "B" });
    await importBackup(backup, "merge");
    expect((await db.projects.toArray()).map((p) => p.title).sort()).toEqual(["A", "B"]);
  });

  it("rejects files that are not DEMAX backups", () => {
    expect(() => parseBackup({ hello: 1 })).toThrow(BackupError);
    expect(() => parseBackup({ app: "demax-studio", version: 99, data: {} })).toThrow(BackupError);
    expect(() =>
      parseBackup({ app: "demax-studio", version: 1, data: { projects: [{ title: "no id" }] } }),
    ).toThrow(BackupError);
  });
});
