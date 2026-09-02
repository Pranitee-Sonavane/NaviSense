/**
 * NAVISENSE domain model.
 * Organization → Buildings → Floors → Map { Rooms, Landmarks, NavNetwork } → QR Points
 *
 * Everything is technology-agnostic: nothing here assumes QR / BLE / CV / IMU
 * for localization. See lib/navisense/localization.ts for that boundary.
 */

export type Id = string;

export type PublishStatus = "draft" | "configuring" | "published";

export type RoomCategory =
  | "classroom"
  | "lab"
  | "office"
  | "library"
  | "cafeteria"
  | "auditorium"
  | "reception"
  | "washroom"
  | "utility";

export type LandmarkType =
  | "entrance"
  | "reception"
  | "stairs"
  | "elevator"
  | "washroom"
  | "cafeteria"
  | "information"
  | "emergency-exit";

export type NavNodeType =
  | "corridor"
  | "intersection"
  | "room"
  | "stairs"
  | "elevator"
  | "entrance"
  | "landmark"
  | "qr";

export interface Point {
  x: number;
  y: number;
}

export interface Rect extends Point {
  w: number;
  h: number;
}

export interface Organization {
  id: Id;
  name: string;
  type: string;
  website: string;
  address: string;
  buildingIds: Id[];
  createdAt: string;
}

export interface Building {
  id: Id;
  orgId: Id;
  name: string;
  type: string;
  address: string;
  description: string;
  status: PublishStatus;
  updatedAt: string;
}

export type MapStatus = "none" | "uploaded" | "processing" | "ready";

export interface Floor {
  id: Id;
  buildingId: Id;
  level: number;
  name: string;
  description: string;
  mapStatus: MapStatus;
  /** Map extent in floor-plan units. */
  extent: { w: number; h: number };
  /** Corridor / walkable shell geometry, purely presentational. */
  corridors: Rect[];
  outline: Rect;
}

export interface Room {
  id: Id;
  floorId: Id;
  number: string;
  name: string;
  category: RoomCategory;
  department: string;
  description: string;
  accessibility: string;
  rect: Rect;
  /** Door position — the room's attachment point to the nav network. */
  door: Point;
  navNodeId: Id | null;
  searchable: boolean;
}

export interface Landmark {
  id: Id;
  floorId: Id;
  type: LandmarkType;
  name: string;
  description: string;
  position: Point;
  navNodeId: Id | null;
}

export interface NavNode {
  id: Id;
  floorId: Id;
  type: NavNodeType;
  label: string;
  position: Point;
  /** For stairs/elevators: shared shaft key linking nodes across floors. */
  shaft?: string;
}

export interface NavEdge {
  id: Id;
  from: Id;
  to: Id;
  /** vertical = floor change (stairs / elevator). */
  kind: "walk" | "vertical";
}

export interface QrPoint {
  id: Id;
  orgId: Id;
  buildingId: Id;
  floorId: Id;
  name: string;
  entryNodeId: Id;
  active: boolean;
  createdAt: string;
  scans: number;
}

export interface ActivityItem {
  id: Id;
  actor: string;
  action: string;
  target: string;
  at: string;
}

export interface NaviData {
  organizations: Organization[];
  buildings: Building[];
  floors: Floor[];
  rooms: Room[];
  landmarks: Landmark[];
  nodes: NavNode[];
  edges: NavEdge[];
  qrPoints: QrPoint[];
  activity: ActivityItem[];
}

export const ROOM_CATEGORY_LABEL: Record<RoomCategory, string> = {
  classroom: "Classroom",
  lab: "Lab",
  office: "Office",
  library: "Library",
  cafeteria: "Cafeteria",
  auditorium: "Auditorium",
  reception: "Reception",
  washroom: "Washroom",
  utility: "Utility",
};

export const LANDMARK_LABEL: Record<LandmarkType, string> = {
  entrance: "Entrance",
  reception: "Reception",
  stairs: "Staircase",
  elevator: "Elevator",
  washroom: "Washroom",
  cafeteria: "Cafeteria",
  information: "Information desk",
  "emergency-exit": "Emergency exit",
};
