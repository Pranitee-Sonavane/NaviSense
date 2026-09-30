import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { RefreshCw, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState, PageHeader, StatusPill } from "@/components/shared/ui-bits";
import { useBuildings, useNavi } from "@/lib/navisense/store";
import { validateBuilding } from "@/lib/navisense/validation";

export const Route = createFileRoute("/admin/validation")({
  head: () => ({
    meta: [
      { title: "Map validation — NAVISENSE admin" },
      { name: "description", content: "Check every floor for unnamed rooms, unconnected points, missing landmarks and QR coverage before publishing." },
      { property: "og:title", content: "Map validation — NAVISENSE admin" },
      { property: "og:description", content: "Readiness checks for your indoor navigation data." },
    ],
  }),
  component: Validation,
});

function Validation() {
  const buildings = useBuildings();
  const { data } = useNavi();
  const [buildingId, setBuildingId] = useState(buildings[0]?.id ?? "");
  const [ran, setRan] = useState(0);

  if (buildings.length === 0) {
    return <EmptyState icon={ShieldCheck} title="Nothing to validate yet" body="Add a building and upload a floor plan first." />;
  }

  const report = validateBuilding(data, buildingId);
  const building = buildings.find((b) => b.id === buildingId);

  return (
    <>
      <PageHeader
        title="Map validation"
        description="Every check here affects whether visitors can actually be routed. Blocking issues must be fixed before publishing."
        actions={
          <>
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
            <Button
              variant="outline"
              onClick={() => {
                setRan((r) => r + 1);
                toast.success("Validation re-run.");
              }}
            >
              <RefreshCw className="mr-1 h-4 w-4" /> Run checks
            </Button>
            <Button asChild disabled={!report.ready}>
              <Link to="/admin/publish">Publish</Link>
            </Button>
          </>
        }
      />

      <div className="mt-6 grid gap-4 lg:grid-cols-[320px_1fr]">
        <div className="rounded-xl border border-border bg-card p-6 shadow-1">
          <p className="text-sm font-medium text-muted-foreground">Navigation readiness</p>
          <p className="mt-2 text-5xl font-semibold numeric">{report.score}%</p>
          <Progress value={report.score} className="mt-4 h-2" />
          <div className="mt-4 flex flex-wrap gap-2">
            <StatusPill tone={report.errors ? "error" : "success"}>{report.errors} blocking</StatusPill>
            <StatusPill tone={report.warnings ? "warning" : "success"}>{report.warnings} to review</StatusPill>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            {report.ready
              ? `${building?.name} is ready to publish. Visitors will get complete routes.`
              : "Fix the blocking issues below — until then some destinations can't be routed."}
          </p>
          <p className="sr-only" aria-live="polite">
            Validation run {ran} times. Score {report.score} percent.
          </p>
        </div>

        <ul className="space-y-3">
          {report.checks.map((c) => (
            <li key={c.id} className="flex flex-col gap-3 rounded-xl border border-border bg-card px-5 py-4 shadow-1 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold">{c.label}</p>
                  <StatusPill tone={c.level === "pass" ? "success" : c.level === "warn" ? "warning" : "error"}>
                    {c.level === "pass" ? "Passed" : c.level === "warn" ? "Needs review" : "Blocking"}
                  </StatusPill>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{c.detail}</p>
              </div>
              {c.level !== "pass" && c.fixTo && (
                <Button size="sm" variant="outline" asChild>
                  <Link to={c.fixTo.to} params={c.fixTo.params as never}>
                    Fix this
                  </Link>
                </Button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
