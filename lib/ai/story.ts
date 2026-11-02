import { db } from "@/lib/db";
import type { StoryData } from "./context";

/** Everything the context builder needs, read fresh at send time. */
export async function loadStory(projectId: string): Promise<StoryData | null> {
  const project = await db.projects.get(projectId);
  if (!project) return null;
  const [chapters, types, entities, links, arcs, beats, threads, events] = await Promise.all([
    db.chapters.where("projectId").equals(projectId).toArray(),
    db.entityTypes.where("projectId").equals(projectId).toArray(),
    db.entities.where("projectId").equals(projectId).toArray(),
    db.links.where("projectId").equals(projectId).toArray(),
    db.arcs.where("projectId").equals(projectId).toArray(),
    db.beats.where("projectId").equals(projectId).toArray(),
    db.threads.where("projectId").equals(projectId).toArray(),
    db.events.where("projectId").equals(projectId).toArray(),
  ]);
  return { project, chapters, types, entities, links, arcs, beats, threads, events };
}
