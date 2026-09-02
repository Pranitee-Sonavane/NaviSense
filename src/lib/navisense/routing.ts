import type { Floor, Id, NavEdge, NavNode, Point } from "./types";

/**
 * Mock route computation over the configured navigation network.
 * Pure geometry + graph search — no localization technology involved.
 */

export type StepKind = "start" | "straight" | "left" | "right" | "stairs" | "elevator" | "arrive";

export interface RouteStep {
  kind: StepKind;
  instruction: string;
  detail: string;
  /** Distance in metres covered by this step. */
  distance: number;
  floorId: Id;
  toNodeId: Id;
}

export interface RouteLeg {
  floorId: Id;
  points: Point[];
}

export interface NaviRoute {
  nodeIds: Id[];
  legs: RouteLeg[];
  steps: RouteStep[];
  distance: number;
  minutes: number;
  floorChanges: number;
}

/** Floor-plan units → metres. */
export const UNITS_PER_METRE = 11;

const dist = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

export function computeRoute(
  nodes: NavNode[],
  edges: NavEdge[],
  floors: Floor[],
  fromId: Id,
  toId: Id,
): NaviRoute | null {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  if (!byId.has(fromId) || !byId.has(toId)) return null;

  const adj = new Map<Id, Array<{ to: Id; cost: number; edge: NavEdge }>>();
  for (const e of edges) {
    const a = byId.get(e.from);
    const b = byId.get(e.to);
    if (!a || !b) continue;
    const cost = e.kind === "vertical" ? 220 : dist(a.position, b.position);
    if (!adj.has(e.from)) adj.set(e.from, []);
    if (!adj.has(e.to)) adj.set(e.to, []);
    adj.get(e.from)!.push({ to: e.to, cost, edge: e });
    adj.get(e.to)!.push({ to: e.from, cost, edge: e });
  }

  const best = new Map<Id, number>([[fromId, 0]]);
  const prev = new Map<Id, Id>();
  const visited = new Set<Id>();
  const queue: Id[] = [fromId];

  while (queue.length) {
    queue.sort((a, b) => (best.get(a) ?? Infinity) - (best.get(b) ?? Infinity));
    const cur = queue.shift()!;
    if (visited.has(cur)) continue;
    visited.add(cur);
    if (cur === toId) break;
    for (const nb of adj.get(cur) ?? []) {
      const cost = (best.get(cur) ?? Infinity) + nb.cost;
      if (cost < (best.get(nb.to) ?? Infinity)) {
        best.set(nb.to, cost);
        prev.set(nb.to, cur);
        if (!visited.has(nb.to)) queue.push(nb.to);
      }
    }
  }

  if (!visited.has(toId)) return null;

  const path: Id[] = [toId];
  while (path[0] !== fromId) {
    const p = prev.get(path[0]);
    if (!p) return null;
    path.unshift(p);
  }

  const pathNodes = path.map((id) => byId.get(id)!);
  const floorName = (id: Id) => floors.find((f) => f.id === id)?.name ?? "this floor";

  // Legs (per-floor polylines)
  const legs: RouteLeg[] = [];
  for (const n of pathNodes) {
    const last = legs[legs.length - 1];
    if (last && last.floorId === n.floorId) last.points.push(n.position);
    else legs.push({ floorId: n.floorId, points: [n.position] });
  }

  // Steps
  const steps: RouteStep[] = [];
  let totalUnits = 0;
  let floorChanges = 0;
  let pending = 0;

  steps.push({
    kind: "start",
    instruction: "Start walking",
    detail: `From ${pathNodes[0].label} on ${floorName(pathNodes[0].floorId)}`,
    distance: 0,
    floorId: pathNodes[0].floorId,
    toNodeId: pathNodes[0].id,
  });

  for (let i = 1; i < pathNodes.length; i++) {
    const prevNode = pathNodes[i - 1];
    const node = pathNodes[i];

    if (prevNode.floorId !== node.floorId) {
      floorChanges++;
      const vertical = prevNode.type === "elevator" ? "elevator" : "stairs";
      if (pending > 0) {
        steps.push({
          kind: "straight",
          instruction: "Continue straight",
          detail: `${Math.round(pending / UNITS_PER_METRE)} m along the corridor`,
          distance: Math.round(pending / UNITS_PER_METRE),
          floorId: prevNode.floorId,
          toNodeId: prevNode.id,
        });
        pending = 0;
      }
      steps.push({
        kind: vertical,
        instruction: vertical === "elevator" ? `Take the elevator to ${floorName(node.floorId)}` : `Take the stairs to ${floorName(node.floorId)}`,
        detail: `${prevNode.label} · ${floorName(prevNode.floorId)} → ${floorName(node.floorId)}`,
        distance: 0,
        floorId: node.floorId,
        toNodeId: node.id,
      });
      continue;
    }

    const segment = dist(prevNode.position, node.position);
    totalUnits += segment;
    pending += segment;

    const nextNode = pathNodes[i + 1];
    const isLast = i === pathNodes.length - 1;
    const turn = nextNode && nextNode.floorId === node.floorId ? turnDirection(prevNode.position, node.position, nextNode.position) : null;

    if (isLast) {
      steps.push({
        kind: "arrive",
        instruction: "You've arrived",
        detail: `${node.label} · ${floorName(node.floorId)}`,
        distance: Math.round(pending / UNITS_PER_METRE),
        floorId: node.floorId,
        toNodeId: node.id,
      });
      pending = 0;
    } else if (turn === "left" || turn === "right") {
      steps.push({
        kind: turn,
        instruction: turn === "left" ? "Turn left" : "Turn right",
        detail: `After ${Math.round(pending / UNITS_PER_METRE)} m, at ${node.label}`,
        distance: Math.round(pending / UNITS_PER_METRE),
        floorId: node.floorId,
        toNodeId: node.id,
      });
      pending = 0;
    }
  }

  const metres = Math.round(totalUnits / UNITS_PER_METRE);
  return {
    nodeIds: path,
    legs,
    steps,
    distance: metres,
    minutes: Math.max(1, Math.round(metres / 60 + floorChanges * 0.6)),
    floorChanges,
  };
}

function turnDirection(a: Point, b: Point, c: Point): "left" | "right" | "straight" {
  const v1 = { x: b.x - a.x, y: b.y - a.y };
  const v2 = { x: c.x - b.x, y: c.y - b.y };
  const cross = v1.x * v2.y - v1.y * v2.x;
  const dot = v1.x * v2.x + v1.y * v2.y;
  const mag = Math.hypot(v1.x, v1.y) * Math.hypot(v2.x, v2.y);
  if (mag === 0 || dot / mag > 0.85) return "straight";
  return cross > 0 ? "right" : "left";
}

export function polylineLength(points: Point[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) total += dist(points[i - 1], points[i]);
  return total;
}
