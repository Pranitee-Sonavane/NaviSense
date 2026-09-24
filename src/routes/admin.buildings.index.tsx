import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, LayoutGrid, List, Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Crumbs, EmptyState, PageHeader, StatusPill } from "@/components/shared/ui-bits";
import { useBuildings, useNavi } from "@/lib/navisense/store";

export const Route = createFileRoute("/admin/buildings/")({
  head: () => ({
    meta: [
      { title: "Buildings — NAVISENSE admin" },
      { name: "description", content: "Every building in your organization with floor counts, room counts and publish status." },
      { property: "og:title", content: "Buildings — NAVISENSE admin" },
      { property: "og:description", content: "Manage the buildings, floors and maps in your NAVISENSE organization." },
    ],
  }),
  component: BuildingsList,
});

function BuildingsList() {
  const buildings = useBuildings();
  const { data } = useNavi();
  const [view, setView] = useState<"table" | "grid">("table");

  const stats = (id: string) => {
    const floors = data.floors.filter((f) => f.buildingId === id);
    const ids = new Set(floors.map((f) => f.id));
    return { floors: floors.length, rooms: data.rooms.filter((r) => ids.has(r.floorId)).length };
  };

  const statusTone = (s: string) => (s === "published" ? "success" : s === "configuring" ? "warning" : "neutral") as const;
  const statusLabel = (s: string) => (s === "published" ? "Published" : s === "configuring" ? "Configuring" : "Draft");

  return (
    <>
      <Crumbs items={[{ label: "Dashboard", to: "/admin" }, { label: "Buildings" }]} />
      <PageHeader
        title="Buildings"
        description="Each building holds its floors, maps, rooms and QR entry points."
        actions={
          <>
            <div className="flex rounded-md border border-border p-0.5" role="group" aria-label="View mode">
              <Button variant={view === "table" ? "secondary" : "ghost"} size="sm" onClick={() => setView("table")} aria-pressed={view === "table"}>
                <List className="mr-1 h-4 w-4" /> Table
              </Button>
              <Button variant={view === "grid" ? "secondary" : "ghost"} size="sm" onClick={() => setView("grid")} aria-pressed={view === "grid"}>
                <LayoutGrid className="mr-1 h-4 w-4" /> Cards
              </Button>
            </div>
            <Button asChild>
              <Link to="/admin/buildings/new">
                <Plus className="mr-1 h-4 w-4" /> Add building
              </Link>
            </Button>
          </>
        }
      />

      {buildings.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={Building2}
          title="No buildings yet"
          body="Add a building to start mapping floors and rooms."
          action={
            <Button asChild>
              <Link to="/admin/buildings/new">Add building</Link>
            </Button>
          }
        />
      ) : view === "table" ? (
        <div className="mt-6 overflow-hidden rounded-xl border border-border bg-card shadow-1">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="numeric">Floors</TableHead>
                <TableHead className="numeric">Rooms</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last updated</TableHead>
                <TableHead className="text-right">Manage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {buildings.map((b) => {
                const s = stats(b.id);
                return (
                  <TableRow key={b.id}>
                    <TableCell>
                      <Link to="/admin/buildings/$buildingId" params={{ buildingId: b.id }} className="font-medium hover:underline">
                        {b.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">{b.type}</p>
                    </TableCell>
                    <TableCell className="numeric">{s.floors}</TableCell>
                    <TableCell className="numeric">{s.rooms}</TableCell>
                    <TableCell>
                      <StatusPill tone={statusTone(b.status)}>{statusLabel(b.status)}</StatusPill>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{b.updatedAt}</TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="outline" size="sm">
                        <Link to="/admin/buildings/$buildingId" params={{ buildingId: b.id }}>
                          Manage
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {buildings.map((b) => {
            const s = stats(b.id);
            return (
              <Link
                key={b.id}
                to="/admin/buildings/$buildingId"
                params={{ buildingId: b.id }}
                className="rounded-xl border border-border bg-card p-5 shadow-1 transition-shadow hover:shadow-2"
              >
                <div className="flex items-start justify-between gap-3">
                  <Building2 className="h-5 w-5 text-primary" aria-hidden />
                  <StatusPill tone={statusTone(b.status)}>{statusLabel(b.status)}</StatusPill>
                </div>
                <h2 className="mt-3 text-base font-semibold">{b.name}</h2>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{b.description}</p>
                <p className="mt-4 text-xs numeric text-muted-foreground">
                  {s.floors} floors · {s.rooms} rooms · updated {b.updatedAt}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
