import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Check, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Crumbs, PageHeader, StatusPill } from "@/components/shared/ui-bits";
import { cn } from "@/lib/utils";
import { useBuilding, useFloor, useNavi } from "@/lib/navisense/store";

export const Route = createFileRoute("/admin/buildings/$buildingId/floors/$floorId/processing")({
  head: () => ({
    meta: [
      { title: "Processing floor plan — NAVISENSE admin" },
      { name: "description", content: "Watch the floor plan move through upload, analysis, extraction and review before you confirm the results." },
      { property: "og:title", content: "Processing floor plan — NAVISENSE admin" },
      { property: "og:description", content: "Floor plan processing status and extracted elements." },
    ],
  }),
  component: Processing,
});

const STAGES = ["Upload", "Analyze", "Extract", "Configure", "Review"];

function Processing() {
  const { buildingId, floorId } = Route.useParams();
  const building = useBuilding(buildingId);
  const floor = useFloor(floorId);
  const { updateFloor } = useNavi();
  const navigate = useNavigate();
  const [stage, setStage] = useState(0);

  useEffect(() => {
    if (stage >= STAGES.length) return;
    const t = setTimeout(() => setStage((s) => s + 1), 900);
    return () => clearTimeout(t);
  }, [stage]);

  const complete = stage >= STAGES.length;

  return (
    <>
      <Crumbs
        items={[
          { label: "Buildings", to: "/admin/buildings" },
          { label: building?.name ?? "Building", to: "/admin/buildings/$buildingId", params: { buildingId } },
          { label: floor?.name ?? "Floor", to: "/admin/buildings/$buildingId/floors/$floorId", params: { buildingId, floorId } },
          { label: "Processing" },
        ]}
      />
      <PageHeader
        title="Preparing your floor plan"
        description="Nothing is accepted automatically — you confirm every detected element before it goes live."
      />

      <div className="mt-6 grid max-w-4xl gap-6 lg:grid-cols-2">
        <ol className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-1">
          {STAGES.map((s, i) => {
            const state = i < stage ? "done" : i === stage ? "active" : "todo";
            return (
              <li key={s} className="flex items-center gap-3">
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full border",
                    state === "done" && "border-success bg-success text-success-foreground",
                    state === "active" && "border-primary text-primary",
                    state === "todo" && "border-border text-muted-foreground",
                  )}
                >
                  {state === "done" ? <Check className="h-4 w-4" /> : state === "active" ? <Loader2 className="h-4 w-4 animate-spin" /> : i + 1}
                </span>
                <span className={cn("text-sm", state === "todo" ? "text-muted-foreground" : "font-medium")}>{s}</span>
              </li>
            );
          })}
        </ol>

        <div className="rounded-xl border border-border bg-card p-6 shadow-1">
          <h2 className="text-sm font-semibold">Extracted elements</h2>
          <ul className="mt-4 space-y-3">
            {[
              ["Rooms", "8", "Auto-detected"],
              ["Corridors", "2", "Auto-detected"],
              ["Doors", "8", "Confirmed"],
              ["Stairs & elevators", "2", "Needs review"],
              ["Text labels", "6", "Needs review"],
            ].map(([label, count, tag]) => (
              <li key={label} className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5">
                <span className="text-sm">
                  {label} <span className="numeric text-muted-foreground">· {count}</span>
                </span>
                <StatusPill tone={tag === "Confirmed" ? "success" : tag === "Needs review" ? "warning" : "neutral"}>{tag}</StatusPill>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <Button
          disabled={!complete}
          onClick={() => {
            updateFloor(floorId, { mapStatus: "ready" });
            navigate({ to: "/admin/buildings/$buildingId/floors/$floorId/editor", params: { buildingId, floorId } });
          }}
        >
          {complete ? "Review in map editor" : "Processing…"}
        </Button>
        <Button asChild variant="ghost">
          <Link to="/admin/buildings/$buildingId" params={{ buildingId }}>
            Back to building
          </Link>
        </Button>
      </div>
    </>
  );
}
