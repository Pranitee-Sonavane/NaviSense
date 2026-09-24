import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  DoorOpen,
  Layers,
  MapPinned,
  Plus,
  QrCode,
  Rocket,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { EmptyState, PageHeader, StatCard, StatusPill } from "@/components/shared/ui-bits";
import { useBuildings, useNavi, useOrg } from "@/lib/navisense/store";
import { validateBuilding } from "@/lib/navisense/validation";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Dashboard — NAVISENSE admin" },
      { name: "description", content: "Organization overview: buildings, floors, mapped rooms, validation warnings and QR deployment status." },
      { property: "og:title", content: "Dashboard — NAVISENSE admin" },
      { property: "og:description", content: "Track mapping progress and navigation readiness across your buildings." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const org = useOrg();
  const buildings = useBuildings();
  const { data } = useNavi();

  const buildingIds = new Set(buildings.map((b) => b.id));
  const floors = data.floors.filter((f) => buildingIds.has(f.buildingId));
  const floorIds = new Set(floors.map((f) => f.id));
  const rooms = data.rooms.filter((r) => floorIds.has(r.floorId));
  const qrs = data.qrPoints.filter((q) => buildingIds.has(q.buildingId));
  const reports = buildings.map((b) => ({ building: b, report: validateBuilding(data, b.id) }));
  const warningCount = reports.reduce((n, r) => n + r.report.warnings + r.report.errors, 0);
  const setupProgress = Math.round(reports.reduce((n, r) => n + r.report.score, 0) / Math.max(1, reports.length));

  if (buildings.length === 0) {
    return (
      <>
        <PageHeader title={org.name} description="Let's map your first building." />
        <EmptyState
          className="mt-8"
          icon={Building2}
          title="No buildings yet"
          body="Add a building, upload its floor plans, and NAVISENSE will turn them into a navigable indoor map."
          action={
            <Button asChild>
              <Link to="/admin/buildings/new">
                <Plus className="mr-1 h-4 w-4" /> Add your first building
              </Link>
            </Button>
          }
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={org.name}
        description={`${org.type} · ${org.address}`}
        actions={
          <>
            <Button asChild variant="outline">
              <Link to="/admin/qr/new">
                <QrCode className="mr-1 h-4 w-4" /> Generate QR
              </Link>
            </Button>
            <Button asChild>
              <Link to="/admin/buildings/new">
                <Plus className="mr-1 h-4 w-4" /> Add building
              </Link>
            </Button>
          </>
        }
      />

      {warningCount > 0 && (
        <div className="mt-6 flex flex-col gap-3 rounded-xl border border-warning/25 bg-warning-soft px-4 py-3 text-warning sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-start gap-2 text-sm font-medium">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            {warningCount} configuration issue{warningCount === 1 ? "" : "s"} need attention before every building is fully navigable.
          </p>
          <Button asChild size="sm" variant="outline" className="shrink-0 border-warning/40 bg-card text-warning hover:bg-warning-soft">
            <Link to="/admin/validation">Review issues</Link>
          </Button>
        </div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Buildings" value={buildings.length} icon={Building2} tone="info" sub={`${buildings.filter((b) => b.status === "published").length} published`} />
        <StatCard label="Floors" value={floors.length} icon={Layers} tone="neutral" sub={`${floors.filter((f) => f.mapStatus === "ready").length} with processed maps`} />
        <StatCard label="Mapped rooms" value={rooms.length} icon={DoorOpen} tone="neutral" sub="Searchable by visitors" />
        <StatCard label="Active QR codes" value={qrs.filter((q) => q.active).length} icon={QrCode} tone="success" sub={`${qrs.length} total generated`} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="rounded-xl border border-border bg-card shadow-1">
            <header className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="text-sm font-semibold">Map configuration status</h2>
              <Link to="/admin/buildings" className="text-sm font-medium text-primary hover:underline">
                All buildings
              </Link>
            </header>
            <ul className="divide-y divide-border">
              {reports.map(({ building, report }) => (
                <li key={building.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        to="/admin/buildings/$buildingId"
                        params={{ buildingId: building.id }}
                        className="text-sm font-semibold text-foreground hover:underline"
                      >
                        {building.name}
                      </Link>
                      <StatusPill tone={building.status === "published" ? "success" : building.status === "configuring" ? "warning" : "neutral"}>
                        {building.status === "published" ? "Published" : building.status === "configuring" ? "Configuring" : "Draft"}
                      </StatusPill>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {data.floors.filter((f) => f.buildingId === building.id).length} floors ·{" "}
                      {report.errors} error{report.errors === 1 ? "" : "s"} · {report.warnings} warning{report.warnings === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 sm:w-56">
                    <Progress value={report.score} className="h-2 flex-1" />
                    <span className="w-10 shrink-0 text-right text-xs font-semibold numeric text-muted-foreground">{report.score}%</span>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl border border-border bg-card shadow-1">
            <header className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="text-sm font-semibold">Validation warnings</h2>
              <Link to="/admin/validation" className="text-sm font-medium text-primary hover:underline">
                Open validation
              </Link>
            </header>
            <ul className="divide-y divide-border">
              {reports
                .flatMap(({ building, report }) =>
                  report.checks.filter((c) => c.level !== "pass").map((c) => ({ building, check: c })),
                )
                .slice(0, 5)
                .map(({ building, check }) => (
                  <li key={`${building.id}-${check.id}`} className="flex items-start gap-3 px-5 py-3.5">
                    <AlertTriangle className={check.level === "error" ? "mt-0.5 h-4 w-4 text-destructive" : "mt-0.5 h-4 w-4 text-warning"} aria-hidden />
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{check.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {building.name} — {check.detail}
                      </p>
                    </div>
                  </li>
                ))}
              {reports.every((r) => r.report.errors + r.report.warnings === 0) && (
                <li className="flex items-center gap-2 px-5 py-6 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-success" aria-hidden /> Everything checks out. All buildings are navigable.
                </li>
              )}
            </ul>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-xl border border-border bg-card p-5 shadow-1">
            <h2 className="text-sm font-semibold">Setup progress</h2>
            <div className="mt-3 flex items-end gap-3">
              <span className="text-3xl font-semibold numeric">{setupProgress}%</span>
              <span className="pb-1.5 text-xs text-muted-foreground">navigation readiness</span>
            </div>
            <Progress value={setupProgress} className="mt-3 h-2" />
            <div className="mt-5 space-y-2">
              <QuickAction to="/admin/buildings/new" icon={Plus} label="Add building" />
              <QuickAction to="/admin/buildings" icon={Upload} label="Manage maps" />
              <QuickAction to="/admin/validation" icon={ShieldCheck} label="Validate maps" />
              <QuickAction to="/admin/qr/new" icon={QrCode} label="Generate QR" />
              <QuickAction to="/admin/publish" icon={Rocket} label="Publish building" primary />
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card shadow-1">
            <header className="border-b border-border px-5 py-4">
              <h2 className="text-sm font-semibold">Recent activity</h2>
            </header>
            <ul className="divide-y divide-border">
              {data.activity.slice(0, 6).map((a) => (
                <li key={a.id} className="px-5 py-3">
                  <p className="text-sm">
                    <span className="font-medium">{a.actor}</span> {a.action}{" "}
                    <span className="font-medium">{a.target}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">{a.at}</p>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl border border-border bg-card p-5 shadow-1">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <MapPinned className="h-4 w-4 text-primary" aria-hidden /> Visitor experience
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              See exactly what someone sees after scanning a code at your entrance.
            </p>
            <Button asChild variant="outline" size="sm" className="mt-3">
              <Link to="/v">Open visitor view</Link>
            </Button>
          </section>
        </div>
      </div>
    </>
  );
}

function QuickAction({
  to,
  icon: Icon,
  label,
  primary,
}: {
  to: string;
  icon: typeof Plus;
  label: string;
  primary?: boolean;
}) {
  return (
    <Button asChild variant={primary ? "default" : "outline"} className="w-full justify-start">
      <Link to={to}>
        <Icon className="mr-2 h-4 w-4" aria-hidden />
        {label}
      </Link>
    </Button>
  );
}
