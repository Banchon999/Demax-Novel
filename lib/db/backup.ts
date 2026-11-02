import { db } from "./index";
import type {
  AiThread,
  Arc,
  Beat,
  Chapter,
  Entity,
  EntityLink,
  EntityType,
  Idea,
  PlotThread,
  Project,
  Setting,
  Snapshot,
  TimelineEvent,
  WritingDay,
} from "./schema";

export const BACKUP_APP = "demax-studio";
/** v2 added events, arcs, beats, threads, aiThreads (v1 files still import). */
export const BACKUP_VERSION = 2;
export const LAST_BACKUP_KEY = "lastBackupAt";

export type BackupData = {
  projects: Project[];
  chapters: Chapter[];
  snapshots: Snapshot[];
  ideas: Idea[];
  writingDays: WritingDay[];
  settings: Setting[];
  entityTypes: EntityType[];
  entities: Entity[];
  links: EntityLink[];
  events: TimelineEvent[];
  arcs: Arc[];
  beats: Beat[];
  threads: PlotThread[];
  aiThreads: AiThread[];
};

export type Backup = {
  app: typeof BACKUP_APP;
  version: number;
  exportedAt: number;
  /** Set when the file holds a single project. */
  projectId?: string;
  data: BackupData;
};

type TableName = keyof BackupData;

/** Primary key of each table: every record must carry it as a string. */
const TABLE_KEYS: Record<TableName, "id" | "key"> = {
  projects: "id",
  chapters: "id",
  snapshots: "id",
  ideas: "id",
  writingDays: "key",
  settings: "key",
  entityTypes: "id",
  entities: "id",
  links: "id",
  events: "id",
  arcs: "id",
  beats: "id",
  threads: "id",
  aiThreads: "id",
};

const TABLES = Object.keys(TABLE_KEYS) as TableName[];

export class BackupError extends Error {}

const allTables = () => TABLES.map((name) => db[name]);

export async function exportAll(): Promise<Backup> {
  const data = {} as BackupData;
  await db.transaction("r", allTables(), async () => {
    for (const name of TABLES) {
      (data as Record<TableName, unknown[]>)[name] = await db[name].toArray();
    }
  });
  return { app: BACKUP_APP, version: BACKUP_VERSION, exportedAt: Date.now(), data };
}

export async function exportProject(projectId: string): Promise<Backup> {
  const full = await exportAll();
  const d = full.data;
  const mine = <T extends { projectId: string | null }>(rows: T[]) =>
    rows.filter((r) => r.projectId === projectId);
  return {
    ...full,
    projectId,
    data: {
      projects: d.projects.filter((p) => p.id === projectId),
      chapters: mine(d.chapters),
      snapshots: mine(d.snapshots),
      ideas: mine(d.ideas),
      writingDays: mine(d.writingDays),
      settings: [],
      entityTypes: mine(d.entityTypes),
      entities: mine(d.entities),
      links: mine(d.links),
      events: mine(d.events),
      arcs: mine(d.arcs),
      beats: mine(d.beats),
      threads: mine(d.threads),
      aiThreads: mine(d.aiThreads),
    },
  };
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/** Validates untrusted JSON (a user-picked file) before it touches the DB. */
export function parseBackup(raw: unknown): Backup {
  if (!isRecord(raw) || raw.app !== BACKUP_APP) {
    throw new BackupError("ไฟล์นี้ไม่ใช่ไฟล์สำรองของ DEMAX Studio");
  }
  if (typeof raw.version !== "number" || raw.version > BACKUP_VERSION) {
    throw new BackupError("ไฟล์สำรองมาจากเวอร์ชันที่ใหม่กว่า กรุณาอัปเดตแอพก่อน");
  }
  if (!isRecord(raw.data)) throw new BackupError("ไฟล์สำรองเสียหาย: ไม่พบข้อมูล");
  const data = {} as Record<TableName, unknown[]>;
  for (const name of TABLES) {
    const rows = raw.data[name] ?? [];
    if (!Array.isArray(rows)) throw new BackupError(`ไฟล์สำรองเสียหาย: ${name}`);
    const key = TABLE_KEYS[name];
    if (!rows.every((r) => isRecord(r) && typeof r[key] === "string" && r[key] !== "")) {
      throw new BackupError(`ไฟล์สำรองเสียหาย: ข้อมูลใน ${name} ไม่ครบ`);
    }
    data[name] = rows;
  }
  return {
    app: BACKUP_APP,
    version: raw.version,
    exportedAt: typeof raw.exportedAt === "number" ? raw.exportedAt : 0,
    projectId: typeof raw.projectId === "string" ? raw.projectId : undefined,
    data: data as unknown as BackupData,
  };
}

/**
 * "merge" upserts by id (records in the file win); "replace" wipes the
 * database first. Runs in one transaction so a failure changes nothing.
 */
export async function importBackup(backup: Backup, mode: "merge" | "replace") {
  await db.transaction("rw", allTables(), async () => {
    if (mode === "replace") await Promise.all(allTables().map((t) => t.clear()));
    for (const name of TABLES) {
      const rows = backup.data[name];
      // Each table's row type differs; the union of tables needs a cast here.
      if (rows.length) await (db[name] as unknown as { bulkPut(r: unknown[]): Promise<unknown> }).bulkPut(rows);
    }
  });
}

export function backupSummary(backup: Backup) {
  return {
    projects: backup.data.projects.length,
    chapters: backup.data.chapters.length,
    ideas: backup.data.ideas.length,
  };
}
