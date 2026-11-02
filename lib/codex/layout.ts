import { forceCenter, forceCollide, forceLink, forceManyBody, forceSimulation, type SimulationNodeDatum } from "d3-force";

type Node = SimulationNodeDatum & { id: string };

/**
 * Deterministic force-directed positions (fixed start ring, fixed ticks) so
 * the graph doesn't reshuffle every time the page opens.
 */
export function forceLayout(ids: string[], edges: { from: string; to: string }[]): Map<string, { x: number; y: number }> {
  const nodes: Node[] = ids.map((id, i) => {
    const angle = (i / Math.max(1, ids.length)) * Math.PI * 2;
    const r = 60 + ids.length * 12;
    return { id, x: Math.cos(angle) * r, y: Math.sin(angle) * r };
  });
  const known = new Set(ids);
  const links = edges.filter((e) => known.has(e.from) && known.has(e.to)).map((e) => ({ source: e.from, target: e.to }));
  const sim = forceSimulation(nodes)
    .force("charge", forceManyBody().strength(-420))
    .force("link", forceLink(links).id((d) => (d as Node).id).distance(150).strength(0.6))
    .force("collide", forceCollide(70))
    .force("center", forceCenter(0, 0))
    .stop();
  for (let i = 0; i < 300; i++) sim.tick();
  return new Map(nodes.map((n) => [n.id, { x: n.x ?? 0, y: n.y ?? 0 }]));
}
