import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, Rocket } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState, PageHeader, StatusPill } from "@/components/shared/ui-bits";
import { useBuildings, useNavi } from "@/lib/navisense/store";
import { validateBuilding } from "@/lib/navisense/validation";

export const Route = createFileRoute("/admin/publish")({
  head: () => ({
    meta: [
      { title: "Publish — NAVISENSE admin" },
      { name: "description", content: "Review readiness and make a building's indoor navigation live for visitors." },
      { property: "og:title", content: "Publish — NAVISENSE admin" },
      { property: "og:description", content: "Take your indoor navigation live." },
    ],
  }),
  component: Publish,
});

function Publish() {
  const buildings = useBuildings();
  const { data, updateBuilding, logActivity } = useNavi();
  const [buildingId, setBuildingId] = useState(buildings[0]?.id ?? "");

  if (buildings.length === 0) {
    return <EmptyState icon={Rocket} title="Nothing to publish yet" body="Add a building first." />;
  }

  const building = buildings.find((b) => b.id === buildingId);
  const report = validateBuilding(data, buildingId);
  const qrs = data.qrPoints.filter((q) => q.buildingId === buildingId && q.active);

  return (
    <>
      <PageHeader
        title="Publish"
        description="Publishing makes this building's maps, rooms and routes visible to anyone who scans a QR code."
        actions={
          <Select value={buildingId} onValueChange={setBuildingId}>
            <SelectTrigger className="w-56" aria-label="Select building">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {buildings.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      <div className="mt-6 grid max-w-4xl gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6 shadow-1">
          <h2 className="text-sm font-semibold">Before you publish</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {[
              [`Validation passed`, report.ready, `${report.errors} blocking issues`],
              [`Active QR codes`, qrs.length > 0, `${qrs.length} active`],
              [`Floor plans processed`, data.floors.filter((f) => f.buildingId === buildingId).every((f) => f.mapStatus === "ready"), "All floors"],
            ].map(([label, ok, detail]) => (
              <li key={label as string} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                <span>{label}</span>
                <StatusPill tone={ok ? "success" : "warning"}>{ok ? (detail as string) : "Not yet"}</StatusPill>
              </li>
            ))}
          </ul>
          <Button variant="outline" className="mt-4 w-full" asChild>
            <Link to="/admin/validation">Review validation</Link>
          </Button>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-1">
          <h2 className="text-sm font-semibold">Deployment status</h2>
          <div className="mt-4 flex items-center gap-3 rounded-lg border border-border px-4 py-4">
            {building?.status === "published" ? (
              <CheckCircle2 className="h-6 w-6 text-success" aria-hidden />
            ) : (
              <Rocket className="h-6 w-6 text-muted-foreground" aria-hidden />
            )}
            <div>
              <p className="text-sm font-semibold">
                {building?.status === "published" ? "Live for visitors" : "Not published yet"}
              </p>
              <p className="text-xs text-muted-foreground">
                {building?.status === "published" ? `Last updated ${building.updatedAt}` : "Visitors will see a 'coming soon' message."}
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              disabled={!report.ready || building?.status === "published"}
              onClick={() => {
                updateBuilding(buildingId, { status: "published" });
                logActivity("published", building?.name ?? "building");
                toast.success(`${building?.name} is live.`);
              }}
            >
              <Rocket className="mr-1 h-4 w-4" /> Publish building
            </Button>
            {building?.status === "published" && (
              <Button
                variant="outline"
                onClick={() => {
                  updateBuilding(buildingId, { status: "configuring" });
                  toast.success("Unpublished. Visitors can no longer navigate here.");
                }}
              >
                Unpublish
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
