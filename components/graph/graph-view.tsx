"use client";

import "@xyflow/react/dist/style.css";
import { Background, Controls, ReactFlow, type Edge, type Node } from "@xyflow/react";
import { useLiveQuery } from "dexie-react-hooks";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ProjectNav } from "@/components/project/project-nav";
import { BackLink, PageTitle, TopBar } from "@/components/top-bar";
import { EmptyState, Loading } from "@/components/ui";
import { forceLayout } from "@/lib/codex/layout";
import { db } from "@/lib/db";
import { useCodex } from "@/lib/hooks/use-codex";

export function GraphView() {
  const projectId = useSearchParams().get("p") ?? "";
  const router = useRouter();
  const project = useLiveQuery(() => db.projects.get(projectId).then((p) => p ?? null), [projectId]);
  const codex = useCodex(projectId);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [showAll, setShowAll] = useState(false);

  const { nodes, edges } = useMemo(() => {
    const linked = new Set(codex.links.flatMap((l) => [l.fromId, l.toId]));
    const visible = codex.entities.filter((e) => !hidden.has(e.typeId) && (showAll || linked.has(e.id)));
    const ids = visible.map((e) => e.id);
    const visibleIds = new Set(ids);
    const shownLinks = codex.links.filter((l) => visibleIds.has(l.fromId) && visibleIds.has(l.toId));
    const pos = forceLayout(ids, shownLinks.map((l) => ({ from: l.fromId, to: l.toId })));
    const nodes: Node[] = visible.map((e) => {
      const t = codex.typeById.get(e.typeId);
      return {
        id: e.id,
        position: pos.get(e.id) ?? { x: 0, y: 0 },
        data: { label: `${t?.icon ?? ""} ${e.name}` },
        style: {
          background: `${t?.color ?? "#888"}33`,
          border: `1.5px solid ${t?.color ?? "#888"}`,
          color: "#ececf3",
          borderRadius: 14,
          fontSize: 13,
          fontWeight: 600,
          width: "auto",
          padding: "6px 10px",
        },
      };
    });
    const edges: Edge[] = shownLinks.map((l) => ({
      id: l.id,
      source: l.fromId,
      target: l.toId,
      label: l.label,
      type: "straight",
      labelStyle: { fill: "#c4b5fd", fontSize: 11 },
      labelBgStyle: { fill: "#15151f" },
      style: { stroke: "#6b6b85" },
    }));
    return { nodes, edges };
  }, [codex, hidden, showAll]);

  if (project === undefined || !codex.ready) return <Loading />;
  if (project === null) return <p className="p-10 text-center text-muted">ไม่พบเรื่องนี้</p>;

  return (
    <>
      <TopBar>
        <BackLink href={`/project?id=${projectId}`} label="กลับไปหน้าเรื่อง" />
        <PageTitle>{project.title}</PageTitle>
      </TopBar>
      <ProjectNav projectId={projectId} active="graph" />
      <main id="main" className="mx-auto max-w-2xl space-y-3 px-4 pt-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {codex.types.map((t) => {
            const off = hidden.has(t.id);
            return (
              <button
                key={t.id}
                type="button"
                aria-pressed={!off}
                onClick={() =>
                  setHidden((h) => {
                    const n = new Set(h);
                    if (off) n.delete(t.id);
                    else n.add(t.id);
                    return n;
                  })
                }
                className={`rounded-full px-2.5 py-1 text-xs ring-1 ${off ? "text-muted ring-white/10 line-through" : "ring-white/20"}`}
                style={off ? undefined : { backgroundColor: `${t.color}26` }}
              >
                {t.icon} {t.name}
              </button>
            );
          })}
          <label className="ml-auto flex items-center gap-1.5 text-xs text-muted">
            <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} className="accent-violet-500" />
            แสดงที่ยังไม่มีความสัมพันธ์
          </label>
        </div>
        {nodes.length === 0 ? (
          <EmptyState icon={<span className="text-2xl">🕸️</span>} title="ยังไม่มีความสัมพันธ์">
            เปิดข้อมูลใน Codex แล้วกด “เพิ่ม” ในส่วนความสัมพันธ์ เช่น พี่น้อง ศัตรู อาจารย์
          </EmptyState>
        ) : (
          <div className="h-[calc(100dvh-14rem)] overflow-hidden rounded-2xl ring-1 ring-white/10" aria-label="แผนผังความสัมพันธ์">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              colorMode="dark"
              fitView
              nodesConnectable={false}
              onNodeClick={(_, n) => router.push(`/entity?id=${n.id}`)}
              proOptions={{ hideAttribution: true }}
              minZoom={0.2}
            >
              <Background color="#2a2a3a" gap={24} />
              <Controls showInteractive={false} />
            </ReactFlow>
          </div>
        )}
        <p className="pb-2 text-center text-xs text-muted">ลากเพื่อเลื่อน · ถ่างนิ้วเพื่อซูม · แตะชื่อเพื่อเปิดรายละเอียด</p>
      </main>
    </>
  );
}
