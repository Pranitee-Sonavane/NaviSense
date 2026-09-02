import type {
  Floor,
  Landmark,
  LandmarkType,
  NaviData,
  NavEdge,
  NavNode,
  QrPoint,
  Rect,
  Room,
  RoomCategory,
} from "./types";

/**
 * Mock spatial dataset for the prototype. Structured exactly like the future
 * API payload so the data layer can be swapped for a real backend later.
 */

const EXTENT = { w: 1000, h: 640 };
const OUTLINE: Rect = { x: 40, y: 40, w: 920, h: 560 };
const CORRIDORS: Rect[] = [
  { x: 60, y: 290, w: 880, h: 70 },
  { x: 460, y: 60, w: 80, h: 520 },
];

const TOP_SLOTS: Rect[] = [
  { x: 60, y: 60, w: 160, h: 225 },
  { x: 230, y: 60, w: 220, h: 225 },
  { x: 550, y: 60, w: 210, h: 225 },
  { x: 770, y: 60, w: 170, h: 225 },
];
const BOTTOM_SLOTS: Rect[] = [
  { x: 60, y: 365, w: 160, h: 215 },
  { x: 230, y: 365, w: 220, h: 215 },
  { x: 550, y: 365, w: 210, h: 215 },
  { x: 770, y: 365, w: 170, h: 215 },
];

interface RoomSeed {
  number: string;
  name: string;
  category: RoomCategory;
  department?: string;
  description?: string;
  accessibility?: string;
}

interface FloorSeed {
  level: number;
  name: string;
  description: string;
  rooms: RoomSeed[];
}

const ENGINEERING_FLOORS: FloorSeed[] = [
  {
    level: 0,
    name: "Ground Floor",
    description: "Main entrance, reception, student services and dining.",
    rooms: [
      { number: "G01", name: "Reception", category: "reception", department: "Administration", description: "Visitor check-in and general enquiries." },
      { number: "G02", name: "Admissions Office", category: "office", department: "Administration" },
      { number: "G03", name: "Library", category: "library", department: "Central Library", description: "Reading hall, journals and digital resources." },
      { number: "G04", name: "Cafeteria", category: "cafeteria", department: "Campus Services" },
      { number: "G05", name: "Seminar Hall", category: "auditorium", department: "Shared", description: "120-seat seminar hall with AV setup." },
      { number: "G06", name: "Faculty Room", category: "office", department: "Engineering" },
      { number: "G07", name: "Washroom Block", category: "washroom" },
      { number: "G08", name: "Facilities Store", category: "utility" },
    ],
  },
  {
    level: 1,
    name: "Floor 1",
    description: "Computer Science teaching labs and classrooms.",
    rooms: [
      { number: "101", name: "CS Lab 101", category: "lab", department: "Computer Science", description: "60-seat programming lab." },
      { number: "102", name: "CS Lab 102", category: "lab", department: "Computer Science" },
      { number: "103", name: "Classroom 103", category: "classroom", department: "Computer Science" },
      { number: "104", name: "Classroom 104", category: "classroom", department: "Computer Science" },
      { number: "105", name: "Faculty Room 105", category: "office", department: "Computer Science" },
      { number: "106", name: "Electronics Lab 106", category: "lab", department: "Electronics" },
      { number: "107", name: "Store Room 107", category: "utility" },
      { number: "108", name: "Washroom 108", category: "washroom" },
    ],
  },
  {
    level: 2,
    name: "Floor 2",
    description: "Research labs and the Computer Science department office.",
    rooms: [
      { number: "201", name: "AI Lab 201", category: "lab", department: "Computer Science", description: "GPU workstations for AI coursework and research." },
      { number: "202", name: "Research Lab 202", category: "lab", department: "Computer Science" },
      { number: "204", name: "Room 204", category: "classroom", department: "Computer Science Department", description: "Departmental seminar room." },
      { number: "205", name: "Classroom 205", category: "classroom", department: "Computer Science" },
      { number: "206", name: "HOD Office 206", category: "office", department: "Computer Science Department" },
      { number: "207", name: "Project Lab 207", category: "lab", department: "Computer Science" },
      { number: "208", name: "Washroom 208", category: "washroom" },
      { number: "209", name: "Server Room 209", category: "utility", accessibility: "Restricted access — staff only." },
    ],
  },
  {
    level: 3,
    name: "Floor 3",
    description: "Auditorium, placement cell and innovation spaces.",
    rooms: [
      { number: "301", name: "Main Auditorium", category: "auditorium", department: "Shared", description: "400-seat auditorium used for convocation and guest lectures." },
      { number: "302", name: "Drawing Hall 302", category: "classroom", department: "Mechanical" },
      { number: "303", name: "Classroom 303", category: "classroom", department: "Shared" },
      { number: "304", name: "Staff Lounge 304", category: "office", department: "Shared" },
      { number: "305", name: "Placement Cell 305", category: "office", department: "Training & Placement" },
      { number: "306", name: "Innovation Lab 306", category: "lab", department: "Incubation Centre" },
      { number: "307", name: "Washroom 307", category: "washroom" },
      { number: "308", name: "Archive 308", category: "utility" },
    ],
  },
];

function corridorAnchorX(x: number): number {
  const anchors = [140, 340, 500, 655, 855];
  return anchors.reduce((best, a) => (Math.abs(a - x) < Math.abs(best - x) ? a : best), anchors[0]);
}

function buildFloor(buildingId: string, seed: FloorSeed) {
  const floorId = `${buildingId}-f${seed.level}`;
  const floor: Floor = {
    id: floorId,
    buildingId,
    level: seed.level,
    name: seed.name,
    description: seed.description,
    mapStatus: "ready",
    extent: EXTENT,
    corridors: CORRIDORS,
    outline: OUTLINE,
  };

  const nodes: NavNode[] = [];
  const edges: NavEdge[] = [];
  const rooms: Room[] = [];
  const landmarks: Landmark[] = [];

  const spine: Array<[string, number, number]> = [
    ["c1", 140, 325],
    ["c2", 340, 325],
    ["cx", 500, 325],
    ["c3", 655, 325],
    ["c4", 855, 325],
  ];
  spine.forEach(([key, x, y], i) => {
    nodes.push({
      id: `${floorId}-${key}`,
      floorId,
      type: key === "cx" ? "intersection" : "corridor",
      label: key === "cx" ? "Central junction" : `Corridor point ${i + 1}`,
      position: { x, y },
    });
    if (i > 0) {
      edges.push({
        id: `${floorId}-e-${spine[i - 1][0]}-${key}`,
        from: `${floorId}-${spine[i - 1][0]}`,
        to: `${floorId}-${key}`,
        kind: "walk",
      });
    }
  });

  const verticals: Array<{ key: string; y: number; type: "stairs" | "elevator"; label: string; shaft: string }> = [
    { key: "stairs", y: 130, type: "stairs", label: "Staircase A", shaft: "S1" },
    { key: "elev", y: 520, type: "elevator", label: "Elevator A", shaft: "E1" },
  ];
  verticals.forEach((v) => {
    nodes.push({
      id: `${floorId}-${v.key}`,
      floorId,
      type: v.type,
      label: v.label,
      position: { x: 500, y: v.y },
      shaft: v.shaft,
    });
    edges.push({
      id: `${floorId}-e-cx-${v.key}`,
      from: `${floorId}-cx`,
      to: `${floorId}-${v.key}`,
      kind: "walk",
    });
    landmarks.push({
      id: `${floorId}-lm-${v.key}`,
      floorId,
      type: v.type,
      name: v.label,
      description: v.type === "elevator" ? "Accessible, serves all floors." : "Serves all floors.",
      position: { x: 500, y: v.y },
      navNodeId: `${floorId}-${v.key}`,
    });
  });

  seed.rooms.forEach((r, i) => {
    const slot = i < 4 ? TOP_SLOTS[i] : BOTTOM_SLOTS[i - 4];
    const doorX = Math.round(slot.x + slot.w / 2);
    const doorY = i < 4 ? slot.y + slot.h : slot.y;
    const nodeId = `${floorId}-rn-${r.number}`;
    nodes.push({
      id: nodeId,
      floorId,
      type: "room",
      label: r.name,
      position: { x: doorX, y: i < 4 ? doorY + 8 : doorY - 8 },
    });
    const anchor = corridorAnchorX(doorX);
    const anchorKey = spine.find(([, x]) => x === anchor)![0];
    edges.push({
      id: `${floorId}-e-${r.number}`,
      from: nodeId,
      to: `${floorId}-${anchorKey}`,
      kind: "walk",
    });
    rooms.push({
      id: `${floorId}-r-${r.number}`,
      floorId,
      number: r.number,
      name: r.name,
      category: r.category,
      department: r.department ?? "",
      description: r.description ?? "",
      accessibility: r.accessibility ?? "Step-free access via Elevator A.",
      rect: slot,
      door: { x: doorX, y: doorY },
      navNodeId: nodeId,
      searchable: r.category !== "utility",
    });
    if (r.category === "washroom") {
      landmarks.push({
        id: `${floorId}-lm-wc-${r.number}`,
        floorId,
        type: "washroom",
        name: `Washroom — ${seed.name}`,
        description: "Accessible washroom available.",
        position: { x: doorX, y: doorY },
        navNodeId: nodeId,
      });
    }
  });

  if (seed.level === 0) {
    nodes.push({
      id: `${floorId}-entrance`,
      floorId,
      type: "entrance",
      label: "Main Entrance",
      position: { x: 500, y: 592 },
    });
    edges.push({
      id: `${floorId}-e-entrance`,
      from: `${floorId}-entrance`,
      to: `${floorId}-elev`,
      kind: "walk",
    });
    const extras: Array<[LandmarkType, string, string, number, number, string]> = [
      ["entrance", "Main Entrance", "Primary visitor entrance, step-free.", 500, 592, `${floorId}-entrance`],
      ["reception", "Reception", "Staffed 8:00–18:00.", 140, 285, `${floorId}-rn-G01`],
      ["information", "Information Desk", "Campus maps and visitor passes.", 340, 285, `${floorId}-rn-G02`],
      ["cafeteria", "Cafeteria", "Open 8:00–19:00.", 855, 285, `${floorId}-rn-G04`],
      ["emergency-exit", "Emergency Exit — West", "Fire exit, alarmed.", 60, 325, `${floorId}-c1`],
    ];
    extras.forEach(([type, name, description, x, y, nodeId], i) => {
      landmarks.push({
        id: `${floorId}-lm-x${i}`,
        floorId,
        type,
        name,
        description,
        position: { x, y },
        navNodeId: nodeId,
      });
    });
  }

  return { floor, rooms, landmarks, nodes, edges };
}

function buildEngineeringBlock() {
  const buildingId = "bld-engineering";
  const floors: Floor[] = [];
  const rooms: Room[] = [];
  const landmarks: Landmark[] = [];
  const nodes: NavNode[] = [];
  const edges: NavEdge[] = [];

  ENGINEERING_FLOORS.forEach((seed) => {
    const built = buildFloor(buildingId, seed);
    floors.push(built.floor);
    rooms.push(...built.rooms);
    landmarks.push(...built.landmarks);
    nodes.push(...built.nodes);
    edges.push(...built.edges);
  });

  // Vertical links between consecutive floors (stairs + elevator shafts).
  for (let i = 0; i < floors.length - 1; i++) {
    const a = floors[i].id;
    const b = floors[i + 1].id;
    edges.push({ id: `v-stairs-${i}`, from: `${a}-stairs`, to: `${b}-stairs`, kind: "vertical" });
    edges.push({ id: `v-elev-${i}`, from: `${a}-elev`, to: `${b}-elev`, kind: "vertical" });
  }

  return { floors, rooms, landmarks, nodes, edges };
}

const engineering = buildEngineeringBlock();

const scienceFloors: Floor[] = [0, 1].map((level) => ({
  id: `bld-science-f${level}`,
  buildingId: "bld-science",
  level,
  name: level === 0 ? "Ground Floor" : `Floor ${level}`,
  description: "Floor plan not uploaded yet.",
  mapStatus: "none" as const,
  extent: EXTENT,
  corridors: CORRIDORS,
  outline: OUTLINE,
}));

const qrPoints: QrPoint[] = [
  {
    id: "qr-main-entrance",
    orgId: "org-nvi",
    buildingId: "bld-engineering",
    floorId: "bld-engineering-f0",
    name: "Main Entrance",
    entryNodeId: "bld-engineering-f0-entrance",
    active: true,
    createdAt: "2026-07-14",
    scans: 1284,
  },
  {
    id: "qr-reception",
    orgId: "org-nvi",
    buildingId: "bld-engineering",
    floorId: "bld-engineering-f0",
    name: "Reception Desk",
    entryNodeId: "bld-engineering-f0-rn-G01",
    active: true,
    createdAt: "2026-07-14",
    scans: 642,
  },
  {
    id: "qr-f1-lobby",
    orgId: "org-nvi",
    buildingId: "bld-engineering",
    floorId: "bld-engineering-f1",
    name: "Floor 1 Lift Lobby",
    entryNodeId: "bld-engineering-f1-elev",
    active: true,
    createdAt: "2026-08-02",
    scans: 213,
  },
  {
    id: "qr-f2-lobby",
    orgId: "org-nvi",
    buildingId: "bld-engineering",
    floorId: "bld-engineering-f2",
    name: "Floor 2 Lift Lobby",
    entryNodeId: "bld-engineering-f2-elev",
    active: false,
    createdAt: "2026-08-11",
    scans: 0,
  },
];

export const initialData: NaviData = {
  organizations: [
    {
      id: "org-nvi",
      name: "North Valley Institute",
      type: "Education — Engineering College",
      website: "northvalley.edu",
      address: "12 Ridge Road, North Valley",
      buildingIds: ["bld-engineering", "bld-science"],
      createdAt: "2026-06-30",
    },
  ],
  buildings: [
    {
      id: "bld-engineering",
      orgId: "org-nvi",
      name: "Engineering Block",
      type: "Academic",
      address: "12 Ridge Road, North Valley",
      description: "Four-floor academic block housing CS, Electronics and shared facilities.",
      status: "published",
      updatedAt: "2026-08-28",
    },
    {
      id: "bld-science",
      orgId: "org-nvi",
      name: "Science Block",
      type: "Academic",
      address: "14 Ridge Road, North Valley",
      description: "Newly added block — floor plans pending upload.",
      status: "draft",
      updatedAt: "2026-08-30",
    },
  ],
  floors: [...engineering.floors, ...scienceFloors],
  rooms: engineering.rooms,
  landmarks: engineering.landmarks,
  nodes: engineering.nodes,
  edges: engineering.edges,
  qrPoints,
  activity: [
    { id: "a1", actor: "P. Sonavane", action: "published", target: "Engineering Block", at: "2 hours ago" },
    { id: "a2", actor: "P. Sonavane", action: "generated QR for", target: "Floor 2 Lift Lobby", at: "Yesterday" },
    { id: "a3", actor: "R. Kulkarni", action: "edited nav network on", target: "Engineering Block · Floor 2", at: "Yesterday" },
    { id: "a4", actor: "R. Kulkarni", action: "added building", target: "Science Block", at: "3 days ago" },
    { id: "a5", actor: "System", action: "completed map processing for", target: "Engineering Block · Floor 3", at: "4 days ago" },
  ],
};
