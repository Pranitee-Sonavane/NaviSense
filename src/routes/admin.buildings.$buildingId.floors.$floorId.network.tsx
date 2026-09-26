import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Spline, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Crumbs, PageHeader, StatusPill } from "@/components/shared/ui-bits";
import { FloorMap, type MapSelection } from "@/components/map/FloorMap";
import { useBuilding, useFloor, useFloorContent, useNavi } from "@/lib/navisense/store";

export const Route = createFileRoute("/admin/buildings/$buildingId/floors/$floorId/network")({
  head: () => ({
    meta: [
      { title: "Navigation network — NAVISENSE admin" },
      { name: "description", content: "Inspect the walkable network of points and connections that routes are built from." },
      { property: "og:title", content: "Navigation network — NAVISENSE admin" },
      { property: "og:description", content: "Points, connections and coverage for this floor." },
    ],
  }),
  component: Network,
});

function Network() {
  const { buildingId, floorId } = Route.useParams();
  const building = useBuilding(buildingId);
  const floor = useFloor(floorId);
  const { rooms, landmarks, nodes, edges, qrPoints } = useFloorContent(floorId);
  const { removeEdge } = useNavi();
  const [selection, setSelection] = useState<MapSelection | null>(null);

  const orphans = nodes.filter((n) => !edges.some((e) => e.from === n.id || e.to === n.id));
  const label = (id: string) => nodes.find((n) => n.id === id)?.label ?? "Unknown";

  return (
    <>
      <Crumbs
        items={[
          { label: "Buildings", to: "/admin/buildings" },
          { label: building?.name ?? "Building", to: "/admin/buildings/$buildingId", params: { buildingId } },
          { label: floor?.name ?? "Floor", to: "/admin/buildings/$buildingId/floors/$floorId", params: { buildingId, floorId } },
          { label: "Navigation network" },
        ]}
      />
      <PageHeader
        title="Navigation network"
        description="Every walkable connection a visitor's route can use. Rooms connect to the network through their door point."
        actions={
          <>
            <StatusPill tone="info">{nodes.length} points</StatusPill>
            <StatusPill tone="info">{edges.length} connections</StatusPill>
            <StatusPill tone={orphans.length ? "warning" : "success"}>
              {orphans.length ? `${orphans.length} unconnected` : "Fully connected"}
            </StatusPill>
          </>
        }
      />

      <div className="mt-6 grid gap-4 xl:grid-cols-[1fr_340px]">
        <FloorMap
          floor={floor}
          rooms={rooms}
          landmarks={landmarks}
          nodes={nodes}
          edges={edges}
          qrPoints={qrPoints}
          layers={{ network: true, qr: true, labels: false }}
          selection={selection}
          onSelect={setSelection}
          className="h-[560px]"
          ariaLabel={`${floor?.name ?? "Floor"} navigation network`}
        />

        <aside className="rounded-xl border border-border bg-card p-5 shadow-1">
          <h2 className="text-sm font-semibold">Connections</h2>
          <ul className="mt-3 max-h-[480px] space-y-2 overflow-y-auto pr-1">
            {edges.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-xs">
                <span className="min-w-0 truncate">
                  {label(e.from)} <Spline className="inline h-3 w-3" aria-hidden /> {label(e.to)}
                </span>
                <button
                  type="button"
                  aria-label="Remove connection"
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => {
                    removeEdge(e.id);
                    toast.success("Connection removed.");
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
          {orphans.length > 0 && (
            <div className="mt-4 rounded-lg border border-warning/25 bg-warning-soft px-3 py-2 text-xs text-warning">
              Unconnected points: {orphans.map((o) => o.label).join(", ")}
            </div>
          )}
          <Button className="mt-4 w-full" variant="outline" onClick={() => toast.info("Open the map editor to add points and connections.")}>
            How do I add connections?
          </Button>
        </aside>
      </div>
    </>
  );
}
