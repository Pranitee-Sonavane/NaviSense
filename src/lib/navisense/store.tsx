import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { initialData } from "./mock-data";
import type {
  Building,
  Floor,
  Id,
  Landmark,
  NaviData,
  NavEdge,
  NavNode,
  QrPoint,
  Room,
} from "./types";

/**
 * Prototype data layer. All mutations are local state so the whole app behaves
 * like a real product without a backend. Swap this provider's internals for API
 * calls later — component code only talks to the hooks below.
 */

interface NaviStore {
  data: NaviData;
  currentOrgId: Id;
  setCurrentOrgId: (id: Id) => void;
  addBuilding: (b: Omit<Building, "id" | "orgId" | "updatedAt" | "status"> & { floorCount: number }) => Building;
  updateBuilding: (id: Id, patch: Partial<Building>) => void;
  addFloor: (f: Omit<Floor, "id" | "extent" | "corridors" | "outline" | "mapStatus">) => Floor;
  updateFloor: (id: Id, patch: Partial<Floor>) => void;
  removeFloor: (id: Id) => void;
  upsertRoom: (room: Room) => void;
  removeRoom: (id: Id) => void;
  upsertLandmark: (lm: Landmark) => void;
  removeLandmark: (id: Id) => void;
  addNode: (node: NavNode) => void;
  removeNode: (id: Id) => void;
  addEdge: (from: Id, to: Id) => void;
  removeEdge: (id: Id) => void;
  addQr: (qr: Omit<QrPoint, "id" | "createdAt" | "scans">) => QrPoint;
  updateQr: (id: Id, patch: Partial<QrPoint>) => void;
  removeQr: (id: Id) => void;
  logActivity: (action: string, target: string) => void;
}

const StoreContext = createContext<NaviStore | null>(null);

const uid = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 9)}`;

export function NaviStoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<NaviData>(initialData);
  const [currentOrgId, setCurrentOrgId] = useState<Id>(initialData.organizations[0].id);

  const logActivity = useCallback((action: string, target: string) => {
    setData((d) => ({
      ...d,
      activity: [{ id: uid("act"), actor: "You", action, target, at: "Just now" }, ...d.activity].slice(0, 12),
    }));
  }, []);

  const value = useMemo<NaviStore>(() => {
    const patchList = <T extends { id: Id }>(list: T[], id: Id, patch: Partial<T>) =>
      list.map((item) => (item.id === id ? { ...item, ...patch } : item));

    return {
      data,
      currentOrgId,
      setCurrentOrgId,
      logActivity,

      addBuilding: (b) => {
        const building: Building = {
          id: uid("bld"),
          orgId: currentOrgId,
          name: b.name,
          type: b.type,
          address: b.address,
          description: b.description,
          status: "draft",
          updatedAt: "Just now",
        };
        const floors: Floor[] = Array.from({ length: Math.max(0, b.floorCount) }, (_, i) => ({
          id: `${building.id}-f${i}`,
          buildingId: building.id,
          level: i,
          name: i === 0 ? "Ground Floor" : `Floor ${i}`,
          description: "",
          mapStatus: "none" as const,
          extent: { w: 1000, h: 640 },
          corridors: [],
          outline: { x: 40, y: 40, w: 920, h: 560 },
        }));
        setData((d) => ({
          ...d,
          buildings: [...d.buildings, building],
          floors: [...d.floors, ...floors],
          organizations: d.organizations.map((o) =>
            o.id === currentOrgId ? { ...o, buildingIds: [...o.buildingIds, building.id] } : o,
          ),
          activity: [{ id: uid("act"), actor: "You", action: "added building", target: building.name, at: "Just now" }, ...d.activity],
        }));
        return building;
      },

      updateBuilding: (id, patch) =>
        setData((d) => ({ ...d, buildings: patchList(d.buildings, id, { ...patch, updatedAt: "Just now" }) })),

      addFloor: (f) => {
        const floor: Floor = {
          ...f,
          id: uid("flr"),
          mapStatus: "none",
          extent: { w: 1000, h: 640 },
          corridors: [],
          outline: { x: 40, y: 40, w: 920, h: 560 },
        };
        setData((d) => ({ ...d, floors: [...d.floors, floor] }));
        return floor;
      },

      updateFloor: (id, patch) => setData((d) => ({ ...d, floors: patchList(d.floors, id, patch) })),
      removeFloor: (id) => setData((d) => ({ ...d, floors: d.floors.filter((f) => f.id !== id) })),

      upsertRoom: (room) =>
        setData((d) => ({
          ...d,
          rooms: d.rooms.some((r) => r.id === room.id) ? d.rooms.map((r) => (r.id === room.id ? room : r)) : [...d.rooms, room],
        })),
      removeRoom: (id) => setData((d) => ({ ...d, rooms: d.rooms.filter((r) => r.id !== id) })),

      upsertLandmark: (lm) =>
        setData((d) => ({
          ...d,
          landmarks: d.landmarks.some((l) => l.id === lm.id)
            ? d.landmarks.map((l) => (l.id === lm.id ? lm : l))
            : [...d.landmarks, lm],
        })),
      removeLandmark: (id) => setData((d) => ({ ...d, landmarks: d.landmarks.filter((l) => l.id !== id) })),

      addNode: (node) => setData((d) => ({ ...d, nodes: [...d.nodes, node] })),
      removeNode: (id) =>
        setData((d) => ({
          ...d,
          nodes: d.nodes.filter((n) => n.id !== id),
          edges: d.edges.filter((e) => e.from !== id && e.to !== id),
        })),
      addEdge: (from, to) =>
        setData((d) => {
          if (from === to) return d;
          const exists = d.edges.some(
            (e) => (e.from === from && e.to === to) || (e.from === to && e.to === from),
          );
          if (exists) return d;
          const a = d.nodes.find((n) => n.id === from);
          const b = d.nodes.find((n) => n.id === to);
          const edge: NavEdge = {
            id: uid("edge"),
            from,
            to,
            kind: a && b && a.floorId !== b.floorId ? "vertical" : "walk",
          };
          return { ...d, edges: [...d.edges, edge] };
        }),
      removeEdge: (id) => setData((d) => ({ ...d, edges: d.edges.filter((e) => e.id !== id) })),

      addQr: (qr) => {
        const created: QrPoint = { ...qr, id: uid("qr"), createdAt: "Just now", scans: 0 };
        setData((d) => ({
          ...d,
          qrPoints: [created, ...d.qrPoints],
          activity: [{ id: uid("act"), actor: "You", action: "generated QR for", target: created.name, at: "Just now" }, ...d.activity],
        }));
        return created;
      },
      updateQr: (id, patch) => setData((d) => ({ ...d, qrPoints: patchList(d.qrPoints, id, patch) })),
      removeQr: (id) => setData((d) => ({ ...d, qrPoints: d.qrPoints.filter((q) => q.id !== id) })),
    };
  }, [data, currentOrgId, logActivity]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useNavi(): NaviStore {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useNavi must be used inside <NaviStoreProvider>");
  return ctx;
}

/* ---------------------------------- selectors --------------------------------- */

export function useOrg() {
  const { data, currentOrgId } = useNavi();
  return data.organizations.find((o) => o.id === currentOrgId) ?? data.organizations[0];
}

export function useBuildings() {
  const { data, currentOrgId } = useNavi();
  return data.buildings.filter((b) => b.orgId === currentOrgId);
}

export function useBuilding(id: Id | undefined) {
  const { data } = useNavi();
  return data.buildings.find((b) => b.id === id);
}

export function useFloors(buildingId: Id | undefined) {
  const { data } = useNavi();
  return data.floors.filter((f) => f.buildingId === buildingId).sort((a, b) => a.level - b.level);
}

export function useFloor(id: Id | undefined) {
  const { data } = useNavi();
  return data.floors.find((f) => f.id === id);
}

export function useFloorContent(floorId: Id | undefined) {
  const { data } = useNavi();
  return useMemo(
    () => ({
      rooms: data.rooms.filter((r) => r.floorId === floorId),
      landmarks: data.landmarks.filter((l) => l.floorId === floorId),
      nodes: data.nodes.filter((n) => n.floorId === floorId),
      edges: data.edges.filter((e) => {
        const ids = new Set(data.nodes.filter((n) => n.floorId === floorId).map((n) => n.id));
        return ids.has(e.from) && ids.has(e.to);
      }),
      qrPoints: data.qrPoints.filter((q) => q.floorId === floorId),
    }),
    [data, floorId],
  );
}

export function useBuildingStats(buildingId: Id) {
  const { data } = useNavi();
  const floors = data.floors.filter((f) => f.buildingId === buildingId);
  const floorIds = new Set(floors.map((f) => f.id));
  return {
    floors: floors.length,
    rooms: data.rooms.filter((r) => floorIds.has(r.floorId)).length,
    landmarks: data.landmarks.filter((l) => floorIds.has(l.floorId)).length,
    qrPoints: data.qrPoints.filter((q) => q.buildingId === buildingId).length,
    mappedFloors: floors.filter((f) => f.mapStatus === "ready").length,
  };
}
