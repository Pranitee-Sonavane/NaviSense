import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { DoorOpen, Flag, MousePointer2, Plus, QrCode, Rocket, Save, ShieldCheck, Spline, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Crumbs, EmptyState, StatusPill } from "@/components/shared/ui-bits";
import { DEFAULT_LAYERS, FloorMap, type FloorMapHandle, type MapLayers, type MapSelection } from "@/components/map/FloorMap";
import { cn } from "@/lib/utils";
import { useBuilding, useFloor, useFloorContent, useFloors, useNavi } from "@/lib/navisense/store";
import { LANDMARK_LABEL, ROOM_CATEGORY_LABEL, type RoomCategory } from "@/lib/navisense/types";

export const Route = createFileRoute("/admin/buildings/$buildingId/floors/$floorId/editor")({
  head: () => ({
    meta: [
      { title: "Map editor — NAVISENSE admin" },
      { name: "description", content: "Spatial editor for indoor floor maps: rooms, landmarks, navigation nodes, connections and QR entry points." },
      { property: "og:title", content: "Map editor — NAVISENSE admin" },
      { property: "og:description", content: "Turn a floor plan into a navigable indoor map." },
    ],
  }),
  component: MapEditor,
});

type Tool = "select" | "node" | "connect";

function MapEditor() {
  const { buildingId, floorId } = Route.useParams();
  const building = useBuilding(buildingId);
  const floors = useFloors(buildingId);
  const floor = useFloor(floorId);
  const { rooms, landmarks, nodes, edges, qrPoints } = useFloorContent(floorId);
  const { upsertRoom, upsertLandmark, addNode, removeNode, addEdge, logActivity, updateQr } = useNavi();
  const navigate = useNavigate();

  const mapRef = useRef<FloorMapHandle>(null);
  const [tool, setTool] = useState<Tool>("select");
  const [layers, setLayers] = useState<MapLayers>({ ...DEFAULT_LAYERS, network: true, qr: true });
  const [selection, setSelection] = useState<MapSelection | null>(null);
  const [connectFrom, setConnectFrom] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  const room = selection?.kind === "room" ? rooms.find((r) => r.id === selection.id) : undefined;
  const landmark = selection?.kind === "landmark" ? landmarks.find((l) => l.id === selection.id) : undefined;
  const node = selection?.kind === "node" ? nodes.find((n) => n.id === selection.id) : undefined;
  const qr = selection?.kind === "qr" ? qrPoints.find((q) => q.id === selection.id) : undefined;

  if (!floor) return <EmptyState icon={MousePointer2} title="Floor not found" body="Pick a floor from the building page." />;

  const handleSelect = (sel: MapSelection | null) => {
    if (tool === "connect" && sel?.kind === "node") {
      if (!connectFrom) {
        setConnectFrom(sel.id);
        toast.info("Now pick the second point to connect.");
      } else {
        addEdge(connectFrom, sel.id);
        setConnectFrom(null);
        setDirty(true);
        toast.success("Walkable connection added.");
      }
      return;
    }
    setSelection(sel);
  };

  return (
    <>
      <Crumbs
        items={[
          { label: "Buildings", to: "/admin/buildings" },
          { label: building?.name ?? "Building", to: "/admin/buildings/$buildingId", params: { buildingId } },
          { label: floor.name, to: "/admin/buildings/$buildingId/floors/$floorId", params: { buildingId, floorId } },
          { label: "Map editor" },
        ]}
      />

      <div className="flex flex-col gap-3 border-b border-border pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-semibold tracking-tight">Map editor</h1>
          <Select value={floorId} onValueChange={(v) => navigate({ to: "/admin/buildings/$buildingId/floors/$floorId/editor", params: { buildingId, floorId: v } })}>
            <SelectTrigger className="w-44" aria-label="Select floor">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {floors.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {dirty ? <StatusPill tone="warning">Unsaved changes</StatusPill> : <StatusPill tone="success">All changes saved</StatusPill>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin/validation">
              <ShieldCheck className="mr-1 h-4 w-4" /> Validate
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin/publish">
              <Rocket className="mr-1 h-4 w-4" /> Publish
            </Link>
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setDirty(false);
              logActivity("saved map for", `${building?.name ?? ""} · ${floor.name}`);
              toast.success("Map saved.");
            }}
          >
            <Save className="mr-1 h-4 w-4" /> Save
          </Button>
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_340px]">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 shadow-1">
            <ToolButton active={tool === "select"} onClick={() => { setTool("select"); setConnectFrom(null); }} icon={MousePointer2} label="Select" />
            <ToolButton active={tool === "node"} onClick={() => { setTool("node"); setConnectFrom(null); }} icon={Plus} label="Add point" />
            <ToolButton active={tool === "connect"} onClick={() => setTool("connect")} icon={Spline} label="Connect" />
            <span className="mx-1 h-6 w-px bg-border" aria-hidden />
            {(["rooms", "labels", "landmarks", "network", "qr"] as const).map((k) => (
              <label key={k} className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium capitalize">
                <Switch
                  checked={layers[k]}
                  onCheckedChange={(v) => setLayers((l) => ({ ...l, [k]: v }))}
                  aria-label={`Toggle ${k} layer`}
                />
                {k === "qr" ? "QR" : k}
              </label>
            ))}
          </div>

          {tool !== "select" && (
            <p className="rounded-lg border border-info/20 bg-info-soft px-3 py-2 text-xs text-info">
              {tool === "node"
                ? "Click anywhere on the map to drop a navigation point."
                : connectFrom
                  ? "Pick the second navigation point to finish the connection."
                  : "Pick two navigation points to connect them as a walkable path."}
            </p>
          )}

          <FloorMap
            handleRef={mapRef}
            floor={floor}
            rooms={rooms}
            landmarks={landmarks}
            nodes={nodes}
            edges={edges}
            qrPoints={qrPoints}
            layers={layers}
            selection={selection}
            onSelect={handleSelect}
            onCanvasClick={
              tool === "node"
                ? (p) => {
                    const id = `node-${Math.random().toString(36).slice(2, 8)}`;
                    addNode({ id, floorId, type: "corridor", label: `Corridor point ${nodes.length + 1}`, position: p });
                    setSelection({ kind: "node", id });
                    setDirty(true);
                    toast.success("Navigation point added.");
                  }
                : () => setSelection(null)
            }
            className="h-[calc(100vh-280px)] min-h-[460px]"
            ariaLabel={`${floor.name} editable floor map`}
          />
        </div>

        <aside className="rounded-xl border border-border bg-card p-5 shadow-1">
          {room ? (
            <RoomPanel
              key={room.id}
              room={room}
              onSave={(patch) => {
                upsertRoom({ ...room, ...patch });
                setDirty(true);
                toast.success("Room updated.");
              }}
            />
          ) : landmark ? (
            <div className="space-y-4">
              <PanelTitle icon={Flag} title={landmark.name} subtitle={LANDMARK_LABEL[landmark.type]} />
              <div className="space-y-2">
                <Label htmlFor="lm-name">Name</Label>
                <Input id="lm-name" defaultValue={landmark.name} onBlur={(e) => { upsertLandmark({ ...landmark, name: e.target.value }); setDirty(true); }} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lm-desc">Description</Label>
                <Textarea id="lm-desc" rows={3} defaultValue={landmark.description} onBlur={(e) => { upsertLandmark({ ...landmark, description: e.target.value }); setDirty(true); }} />
              </div>
              <p className="numeric text-xs text-muted-foreground">Position {landmark.position.x}, {landmark.position.y}</p>
            </div>
          ) : node ? (
            <div className="space-y-4">
              <PanelTitle icon={Spline} title={node.label} subtitle={`${node.type} point`} />
              <p className="numeric text-xs text-muted-foreground">
                Position {node.position.x}, {node.position.y} · {edges.filter((e) => e.from === node.id || e.to === node.id).length} connections
              </p>
              <Button
                variant="outline"
                className="w-full text-destructive"
                onClick={() => {
                  removeNode(node.id);
                  setSelection(null);
                  setDirty(true);
                  toast.success("Navigation point removed.");
                }}
              >
                <Trash2 className="mr-1 h-4 w-4" /> Delete point
              </Button>
            </div>
          ) : qr ? (
            <div className="space-y-4">
              <PanelTitle icon={QrCode} title={qr.name} subtitle={`${qr.scans} scans`} />
              <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                <span className="text-sm">Active</span>
                <Switch checked={qr.active} onCheckedChange={(v) => updateQr(qr.id, { active: v })} aria-label="QR active" />
              </div>
              <Button variant="outline" className="w-full" asChild>
                <Link to="/admin/qr">Open QR management</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <PanelTitle icon={MousePointer2} title="Nothing selected" subtitle="Click a room, landmark or point" />
              <dl className="space-y-2 text-sm">
                {[
                  ["Rooms", rooms.length],
                  ["Landmarks", landmarks.length],
                  ["Navigation points", nodes.length],
                  ["Connections", edges.length],
                  ["QR entry points", qrPoints.length],
                ].map(([k, v]) => (
                  <div key={k as string} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="numeric font-medium">{v}</dd>
                  </div>
                ))}
              </dl>
              <Button variant="outline" className="w-full" asChild>
                <Link to="/admin/buildings/$buildingId/floors/$floorId/landmarks" params={{ buildingId, floorId }}>
                  Manage landmarks
                </Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link to="/admin/buildings/$buildingId/floors/$floorId/network" params={{ buildingId, floorId }}>
                  Inspect navigation network
                </Link>
              </Button>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}

function PanelTitle({ icon: Icon, title, subtitle }: { icon: typeof Flag; title: string; subtitle: string }) {
  return (
    <div className="flex items-start gap-3 border-b border-border pb-4">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{title}</p>
        <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}

function ToolButton({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: typeof Flag; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
        active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
      )}
    >
      <Icon className="h-4 w-4" aria-hidden /> {label}
    </button>
  );
}

function RoomPanel({
  room,
  onSave,
}: {
  room: import("@/lib/navisense/types").Room;
  onSave: (patch: Partial<import("@/lib/navisense/types").Room>) => void;
}) {
  const [name, setName] = useState(room.name);
  const [number, setNumber] = useState(room.number);
  const [category, setCategory] = useState<RoomCategory>(room.category);
  const [department, setDepartment] = useState(room.department);
  const [description, setDescription] = useState(room.description);
  const [accessibility, setAccessibility] = useState(room.accessibility);
  const [searchable, setSearchable] = useState(room.searchable);

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSave({ name, number, category, department, description, accessibility, searchable });
      }}
    >
      <PanelTitle icon={DoorOpen} title={room.name} subtitle={`${room.number} · ${ROOM_CATEGORY_LABEL[room.category]}`} />
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="r-num">Number</Label>
          <Input id="r-num" value={number} onChange={(e) => setNumber(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="r-cat">Type</Label>
          <Select value={category} onValueChange={(v) => setCategory(v as RoomCategory)}>
            <SelectTrigger id="r-cat">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(ROOM_CATEGORY_LABEL).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="r-name">Name</Label>
        <Input id="r-name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="r-dept">Department</Label>
        <Input id="r-dept" value={department} onChange={(e) => setDepartment(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="r-desc">Description</Label>
        <Textarea id="r-desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="r-acc">Accessibility notes</Label>
        <Input id="r-acc" value={accessibility} onChange={(e) => setAccessibility(e.target.value)} placeholder="e.g. Step-free access" />
      </div>
      <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
        <span className="text-sm">Visible in visitor search</span>
        <Switch checked={searchable} onCheckedChange={setSearchable} aria-label="Searchable" />
      </div>
      <p className="text-xs text-muted-foreground">
        {room.navNodeId ? "Connected to the navigation network." : "Not yet connected to a navigation point."}
      </p>
      <Button type="submit" className="w-full">
        Save room
      </Button>
    </form>
  );
}
