import Dexie, { type EntityTable } from "dexie";
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

export class DemaxDB extends Dexie {
  projects!: EntityTable<Project, "id">;
  chapters!: EntityTable<Chapter, "id">;
  snapshots!: EntityTable<Snapshot, "id">;
  ideas!: EntityTable<Idea, "id">;
  writingDays!: EntityTable<WritingDay, "key">;
  settings!: EntityTable<Setting, "key">;
  entityTypes!: EntityTable<EntityType, "id">;
  entities!: EntityTable<Entity, "id">;
  links!: EntityTable<EntityLink, "id">;
  events!: EntityTable<TimelineEvent, "id">;
  arcs!: EntityTable<Arc, "id">;
  beats!: EntityTable<Beat, "id">;
  threads!: EntityTable<PlotThread, "id">;
  aiThreads!: EntityTable<AiThread, "id">;

  constructor() {
    super("demax-studio");
    // Bump the version and add an .upgrade() when changing indexes.
    this.version(1).stores({
      projects: "id, updatedAt",
      chapters: "id, projectId, [projectId+order], updatedAt",
      snapshots: "id, chapterId, projectId, [chapterId+createdAt]",
      ideas: "id, projectId, createdAt",
      writingDays: "key, projectId, date",
      settings: "key",
      entityTypes: "id, projectId",
      entities: "id, projectId, typeId, *tags",
      links: "id, projectId, fromId, toId",
    });
    this.version(2)
      .stores({
        events: "id, projectId, sortKey",
        arcs: "id, projectId, order",
        beats: "id, projectId, arcId, chapterId",
        threads: "id, projectId, status",
        aiThreads: "id, projectId, updatedAt",
      })
      .upgrade((tx) =>
        tx
          .table("entities")
          .toCollection()
          .modify((e: { progressions?: unknown[] }) => {
            e.progressions ??= [];
          }),
      );
  }
}

export const db = new DemaxDB();
