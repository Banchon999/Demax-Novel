"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useMemo } from "react";
import { db } from "@/lib/db";
import { projectTypes } from "@/lib/db/codex";
import { buildTerms } from "@/lib/codex/mentions";
import type { Entity, EntityType } from "@/lib/db/schema";

/** Live codex of one project plus lookups most screens need. */
export function useCodex(projectId: string | undefined) {
  const types = useLiveQuery(() => (projectId ? projectTypes(projectId) : []), [projectId]);
  const entities = useLiveQuery(
    () => (projectId ? db.entities.where("projectId").equals(projectId).sortBy("name") : []),
    [projectId],
  );
  const links = useLiveQuery(
    () => (projectId ? db.links.where("projectId").equals(projectId).toArray() : []),
    [projectId],
  );
  return useMemo(() => {
    const typeById = new Map<string, EntityType>((types ?? []).map((t) => [t.id, t]));
    const entityById = new Map<string, Entity>((entities ?? []).map((e) => [e.id, e]));
    const tags = [...new Set((entities ?? []).flatMap((e) => e.tags))].sort((a, b) => a.localeCompare(b, "th"));
    return {
      ready: types !== undefined && entities !== undefined && links !== undefined,
      types: types ?? [],
      entities: entities ?? [],
      links: links ?? [],
      typeById,
      entityById,
      tags,
      terms: buildTerms(entities ?? []),
    };
  }, [types, entities, links]);
}
