import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChevronRight, Layers, MapPinned, Plus, QrCode, Rocket, ShieldCheck, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Crumbs, EmptyState, PageHeader, StatusPill } from "@/components/shared/ui-bits";
import { useBuilding, useFloors, useNavi } from "@/lib/navisense/store";
import { validateBuilding } from "@/lib/navisense/validation";

export const Route = createFileRoute("/admin/buildings/$buildingId/")({
  head: () => ({
    meta: [
      { title: "Building details — NAVISENSE admin" },
      { name: "description", content: "Floors, map status, QR codes and validation for a single building." },
      { property: "og:title", content: "Building details — NAVISENSE admin" },
      { property: "og:description", content: "Review floors, maps, QR entry points and readiness for this building." },
    ],
  }),
  component: BuildingDetails,
});

function BuildingDetails() {
  const { buildingId } = Route.useParams();
  const building = useBuilding(buildingId);
  const floors = useFloors(buildingId);
  const { data, updateBuilding } = useNavi();
  const navigate = useNavigate();

  if (!building) {
    return <EmptyState icon={Layers} title="Building not found" body="It may have been removed." action={<Button asChild><Link to="/admin/buildings">Back to buildings</Link></Button>} />;
  }

  const report = validateBuilding(data, building.id);
  const qrs = data.qrPoints.filter((q) => q.buildingId === building.id);
  const roomsOn = (floorId: string) => data.rooms.filter((r) => r.floorId === floorId).length;

  return (
    <>
      <Crumbs items={[{ label: "Dashboard", to: "/admin" }, { label: "Buildings", to: "/admin/buildings" }, { label: building.name }]} />
      <PageHeader
        title={building.name}
        description={`${building.type} · ${building.address || "No address set"} · updated ${building.updatedAt}`}
        actions={
          <>
            <StatusPill tone={building.status === "published" ? "success" : building.status === "configuring" ? "warning" : "neutral"}>
              {building.status === "published" ? "Published" : building.status === "configuring" ? "Configuring" : "Draft"}
            </StatusPill>
            <Button variant="outline" asChild>
              <Link to="/admin/validation">
                <ShieldCheck className="mr-1 h-4 w-4" /> Validate
              </Link>
            </Button>
            <Button asChild>
              <Link to="/admin/publish">
                <Rocket className="mr-1 h-4 w-4" /> Publish
              </Link>
            </Button>
          </>
        }
      />

      <Tabs defaultValue="floors" className="mt-6">
        <TabsList>
          <TabsTrigger value="floors">Floors</TabsTrigger>
          <TabsTrigger value="maps">Map status</TabsTrigger>
          <TabsTrigger value="qr">QR</TabsTrigger>
          <TabsTrigger value="validation">Validation</TabsTrigger>
        </TabsList>

        <TabsContent value="floors" className="mt-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Ordered ground floor upward. Each floor holds its own map, rooms and landmarks.</p>
            <Button asChild size="sm" variant="outline">
              <Link to="/admin/buildings/$buildingId/floors/new" params={{ buildingId }}>
                <Plus className="mr-1 h-4 w-4" /> Add floor
              </Link>
            </Button>
          </div>
          {floors.length === 0 ? (
            <EmptyState icon={Layers} title="No floors yet" body="Add the ground floor to get started." />
          ) : (
            <ul className="space-y-3">
              {floors.map((f) => (
                <li key={f.id}>
                  <Link
                    to="/admin/buildings/$buildingId/floors/$floorId"
                    params={{ buildingId, floorId: f.id }}
                    className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card px-5 py-4 shadow-1 transition-shadow hover:shadow-2"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold">{f.name}</span>
                        <StatusPill tone={f.mapStatus === "ready" ? "success" : f.mapStatus === "none" ? "warning" : "info"}>
                          {f.mapStatus === "ready" ? "Map ready" : f.mapStatus === "none" ? "No map" : "Processing"}
                        </StatusPill>
                      </div>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {roomsOn(f.id)} rooms · {data.landmarks.filter((l) => l.floorId === f.id).length} landmarks
                        {f.description ? ` · ${f.description}` : ""}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="maps" className="mt-5 space-y-3">
          {floors.map((f) => (
            <div key={f.id} className="flex flex-col gap-3 rounded-xl border border-border bg-card px-5 py-4 shadow-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold">{f.name}</p>
                <p className="text-xs text-muted-foreground">
                  {f.mapStatus === "ready" ? "Processed and editable" : "Floor plan not uploaded yet"}
                </p>
              </div>
              <div className="flex gap-2">
                <Button asChild size="sm" variant="outline">
                  <Link to="/admin/buildings/$buildingId/floors/$floorId/upload" params={{ buildingId, floorId: f.id }}>
                    <Upload className="mr-1 h-4 w-4" /> Upload plan
                  </Link>
                </Button>
                <Button asChild size="sm" disabled={f.mapStatus !== "ready"}>
                  <Link to="/admin/buildings/$buildingId/floors/$floorId/editor" params={{ buildingId, floorId: f.id }}>
                    <MapPinned className="mr-1 h-4 w-4" /> Map editor
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="qr" className="mt-5">
          {qrs.length === 0 ? (
            <EmptyState
              icon={QrCode}
              title="No QR codes generated yet"
              body="Generate a code for each entrance so visitors can start navigating."
              action={<Button asChild><Link to="/admin/qr/new">Generate QR</Link></Button>}
            />
          ) : (
            <ul className="space-y-3">
              {qrs.map((q) => (
                <li key={q.id} className="flex items-center justify-between rounded-xl border border-border bg-card px-5 py-4 shadow-1">
                  <div>
                    <p className="text-sm font-semibold">{q.name}</p>
                    <p className="text-xs numeric text-muted-foreground">
                      {data.floors.find((f) => f.id === q.floorId)?.name} · created {q.createdAt} · {q.scans} scans
                    </p>
                  </div>
                  <StatusPill tone={q.active ? "success" : "neutral"}>{q.active ? "Active" : "Disabled"}</StatusPill>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="validation" className="mt-5">
          <div className="rounded-xl border border-border bg-card p-5 shadow-1">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold">Navigation readiness</p>
                <p className="text-xs text-muted-foreground">
                  {report.errors} errors · {report.warnings} warnings
                </p>
              </div>
              <span className="text-2xl font-semibold numeric">{report.score}%</span>
            </div>
            <Progress value={report.score} className="mt-3 h-2" />
            <ul className="mt-5 space-y-2">
              {report.checks.map((c) => (
                <li key={c.id} className="flex items-start justify-between gap-3 rounded-lg border border-border px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">{c.label}</p>
                    <p className="text-xs text-muted-foreground">{c.detail}</p>
                  </div>
                  <StatusPill tone={c.level === "pass" ? "success" : c.level === "warn" ? "warning" : "error"}>
                    {c.level === "pass" ? "Passed" : c.level === "warn" ? "Needs review" : "Blocking"}
                  </StatusPill>
                </li>
              ))}
            </ul>
            <div className="mt-5 flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  updateBuilding(building.id, { status: "configuring" });
                  toast.success("Validation re-run. Results refreshed.");
                }}
              >
                Run validation again
              </Button>
              <Button onClick={() => navigate({ to: "/admin/publish" })} disabled={!report.ready}>
                Continue to publish
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}
