import Dexie, { type EntityTable } from "dexie";
import type {
  Chapter,
  Entity,
  EntityLink,
  EntityType,
  Idea,
  Project,
  Setting,
  Snapshot,
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
  }
}

export const db = new DemaxDB();
