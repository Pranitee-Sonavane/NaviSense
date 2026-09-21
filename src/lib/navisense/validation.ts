import type { Id, NaviData } from "./types";

export type CheckLevel = "pass" | "warn" | "error";

export interface ValidationCheck {
  id: string;
  label: string;
  level: CheckLevel;
  detail: string;
  fixTo?: { floorId?: Id; hint: string };
}

export interface ValidationReport {
  checks: ValidationCheck[];
  score: number;
  ready: boolean;
  errors: number;
  warnings: number;
}

export function validateBuilding(data: NaviData, buildingId: Id): ValidationReport {
  const floors = data.floors.filter((f) => f.buildingId === buildingId).sort((a, b) => a.level - b.level);
  const floorIds = new Set(floors.map((f) => f.id));
  const rooms = data.rooms.filter((r) => floorIds.has(r.floorId));
  const landmarks = data.landmarks.filter((l) => floorIds.has(l.floorId));
  const nodes = data.nodes.filter((n) => floorIds.has(n.floorId));
  const nodeIds = new Set(nodes.map((n) => n.id));
  const edges = data.edges.filter((e) => nodeIds.has(e.from) || nodeIds.has(e.to));
  const qrs = data.qrPoints.filter((q) => q.buildingId === buildingId);

  const checks: ValidationCheck[] = [];
  const add = (c: ValidationCheck) => checks.push(c);

  const unmapped = floors.filter((f) => f.mapStatus !== "ready");
  add({
    id: "floors",
    label: "All floors have a processed floor plan",
    level: floors.length === 0 ? "error" : unmapped.length ? "warn" : "pass",
    detail:
      floors.length === 0
        ? "This building has no floors yet."
        : unmapped.length
          ? `${unmapped.length} floor(s) still need a map: ${unmapped.map((f) => f.name).join(", ")}`
          : `${floors.length} floors configured.`,
    fixTo: unmapped[0] ? { floorId: unmapped[0].id, hint: "Upload floor plan" } : undefined,
  });

  const hasEntrance = landmarks.some((l) => l.type === "entrance");
  add({
    id: "entrance",
    label: "Main entrance configured",
    level: hasEntrance ? "pass" : "error",
    detail: hasEntrance ? "Main entrance is placed and connected." : "No entrance landmark found — visitors have no starting point.",
    fixTo: floors[0] ? { floorId: floors[0].id, hint: "Add entrance" } : undefined,
  });

  const unnamed = rooms.filter((r) => !r.name.trim() || !r.number.trim());
  add({
    id: "room-names",
    label: "All rooms have a name and number",
    level: unnamed.length ? "warn" : "pass",
    detail: unnamed.length ? `${unnamed.length} room(s) missing a name or number.` : `${rooms.length} rooms named.`,
    fixTo: unnamed[0] ? { floorId: unnamed[0].floorId, hint: "Name rooms" } : undefined,
  });

  const disconnectedRooms = rooms.filter((r) => !r.navNodeId || !edges.some((e) => e.from === r.navNodeId || e.to === r.navNodeId));
  add({
    id: "room-paths",
    label: "Every room is connected to a walkable path",
    level: disconnectedRooms.length ? "error" : "pass",
    detail: disconnectedRooms.length
      ? `${disconnectedRooms.length} room(s) can't be routed to: ${disconnectedRooms.slice(0, 3).map((r) => r.name).join(", ")}`
      : "All rooms reachable from the navigation network.",
    fixTo: disconnectedRooms[0] ? { floorId: disconnectedRooms[0].floorId, hint: "Connect paths" } : undefined,
  });

  const orphanNodes = nodes.filter((n) => !edges.some((e) => e.from === n.id || e.to === n.id));
  add({
    id: "orphan-nodes",
    label: "No unconnected navigation points",
    level: orphanNodes.length ? "warn" : "pass",
    detail: orphanNodes.length ? `${orphanNodes.length} navigation point(s) are not linked to anything.` : "Navigation network is fully linked.",
    fixTo: orphanNodes[0] ? { floorId: orphanNodes[0].floorId, hint: "Link points" } : undefined,
  });

  const stairFloors = new Set(landmarks.filter((l) => l.type === "stairs").map((l) => l.floorId));
  add({
    id: "stairs",
    label: "Stairs configured on every floor",
    level: floors.length && stairFloors.size === floors.length ? "pass" : "warn",
    detail:
      floors.length && stairFloors.size === floors.length
        ? "Stairs present on all floors."
        : `Stairs missing on ${Math.max(0, floors.length - stairFloors.size)} floor(s).`,
  });

  const elevFloors = new Set(landmarks.filter((l) => l.type === "elevator").map((l) => l.floorId));
  add({
    id: "elevator",
    label: "Accessible elevator route between floors",
    level: floors.length <= 1 ? "pass" : elevFloors.size === floors.length ? "pass" : "warn",
    detail:
      floors.length <= 1
        ? "Single-floor building — no vertical route needed."
        : elevFloors.size === floors.length
          ? "Elevator links every floor (step-free route available)."
          : "Some floors have no elevator — step-free routing may fail.",
  });

  const verticalLinks = data.edges.filter((e) => e.kind === "vertical" && nodeIds.has(e.from) && nodeIds.has(e.to));
  add({
    id: "floor-links",
    label: "Floors linked to each other",
    level: floors.length <= 1 ? "pass" : verticalLinks.length >= floors.length - 1 ? "pass" : "error",
    detail:
      floors.length <= 1
        ? "Not applicable."
        : verticalLinks.length >= floors.length - 1
          ? `${verticalLinks.length} floor-to-floor links configured.`
          : "Floors are not fully linked — multi-floor routes will fail.",
  });

  add({
    id: "qr",
    label: "At least one active QR entry point",
    level: qrs.some((q) => q.active) ? "pass" : "error",
    detail: qrs.some((q) => q.active) ? `${qrs.filter((q) => q.active).length} active QR point(s).` : "No active QR code — visitors cannot enter the experience.",
  });

  const errors = checks.filter((c) => c.level === "error").length;
  const warnings = checks.filter((c) => c.level === "warn").length;
  const score = Math.round((checks.filter((c) => c.level === "pass").length / checks.length) * 100);

  return { checks, score, ready: errors === 0, errors, warnings };
}
