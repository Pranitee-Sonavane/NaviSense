import { createFileRoute, Link } from "@tanstack/react-router";
import { DoorOpen, Flag, Layers, MapPinned, Route as RouteIcon, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Crumbs, EmptyState, PageHeader, StatusPill } from "@/components/shared/ui-bits";
import { FloorMap } from "@/components/map/FloorMap";
import { useBuilding, useFloor, useFloorContent } from "@/lib/navisense/store";

export const Route = createFileRoute("/admin/buildings/$buildingId/floors/$floorId/")({
  head: () => ({
    meta: [
      { title: "Floor details — NAVISENSE admin" },
      { name: "description", content: "Floor plan preview with room, landmark and navigation point counts, plus a shortcut into the map editor." },
      { property: "og:title", content: "Floor details — NAVISENSE admin" },
      { property: "og:description", content: "Review this floor's rooms, landmarks and navigation coverage." },
    ],
  }),
  component: FloorDetails,
});

function FloorDetails() {
  const { buildingId, floorId } = Route.useParams();
  const building = useBuilding(buildingId);
  const floor = useFloor(floorId);
  const { rooms, landmarks, nodes, edges, qrPoints } = useFloorContent(floorId);

  if (!floor) {
    return <EmptyState icon={Layers} title="Floor not found" body="It may have been removed." />;
  }

  const counts = [
    { label: "Rooms", value: rooms.length, icon: DoorOpen },
    { label: "Landmarks", value: landmarks.length, icon: Flag },
    { label: "Navigation points", value: nodes.length, icon: RouteIcon },
    { label: "QR points", value: qrPoints.length, icon: MapPinned },
  ];

  return (
    <>
      <Crumbs
        items={[
          { label: "Buildings", to: "/admin/buildings" },
          { label: building?.name ?? "Building", to: "/admin/buildings/$buildingId", params: { buildingId } },
          { label: floor.name },
        ]}
      />
      <PageHeader
        title={floor.name}
        description={floor.description || "No description yet."}
        actions={
          <>
            <StatusPill tone={floor.mapStatus === "ready" ? "success" : "warning"}>
              {floor.mapStatus === "ready" ? "Map ready" : "No map uploaded"}
            </StatusPill>
            <Button asChild variant="outline">
              <Link to="/admin/buildings/$buildingId/floors/$floorId/upload" params={{ buildingId, floorId }}>
                <Upload className="mr-1 h-4 w-4" /> Replace plan
              </Link>
            </Button>
            <Button asChild disabled={floor.mapStatus !== "ready"}>
              <Link to="/admin/buildings/$buildingId/floors/$floorId/editor" params={{ buildingId, floorId }}>
                <MapPinned className="mr-1 h-4 w-4" /> Open in map editor
              </Link>
            </Button>
          </>
        }
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {counts.map((c) => (
          <div key={c.label} className="rounded-xl border border-border bg-card p-4 shadow-1">
            <c.icon className="h-4 w-4 text-muted-foreground" aria-hidden />
            <p className="mt-2 text-2xl font-semibold numeric">{c.value}</p>
            <p className="text-xs text-muted-foreground">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-6">
        {floor.mapStatus === "ready" ? (
          <FloorMap
            floor={floor}
            rooms={rooms}
            landmarks={landmarks}
            nodes={nodes}
            edges={edges}
            qrPoints={qrPoints}
            className="h-[520px]"
            ariaLabel={`${floor.name} floor plan preview`}
          />
        ) : (
          <EmptyState
            icon={Upload}
            title="No floor plan on this floor yet"
            body="Upload an image, PDF or SVG plan and we'll prepare it for editing."
            action={
              <Button asChild>
                <Link to="/admin/buildings/$buildingId/floors/$floorId/upload" params={{ buildingId, floorId }}>
                  Upload floor plan
                </Link>
              </Button>
            }
          />
        )}
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm">
          <Link to="/admin/buildings/$buildingId/floors/$floorId/landmarks" params={{ buildingId, floorId }}>
            Manage landmarks
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link to="/admin/buildings/$buildingId/floors/$floorId/network" params={{ buildingId, floorId }}>
            Navigation network
          </Link>
        </Button>
      </div>
    </>
  );
}
