import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertCircle, FileUp, RotateCcw, UploadCloud } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Crumbs, PageHeader } from "@/components/shared/ui-bits";
import { cn } from "@/lib/utils";
import { useBuilding, useFloor, useNavi } from "@/lib/navisense/store";

export const Route = createFileRoute("/admin/buildings/$buildingId/floors/$floorId/upload")({
  head: () => ({
    meta: [
      { title: "Upload floor plan — NAVISENSE admin" },
      { name: "description", content: "Drag and drop a floor plan image, PDF or SVG to start turning it into a navigable indoor map." },
      { property: "og:title", content: "Upload floor plan — NAVISENSE admin" },
      { property: "og:description", content: "Upload a floor plan for this floor." },
    ],
  }),
  component: MapUpload,
});

type Phase = "idle" | "dragging" | "uploading" | "failed";

function MapUpload() {
  const { buildingId, floorId } = Route.useParams();
  const building = useBuilding(buildingId);
  const floor = useFloor(floorId);
  const { updateFloor } = useNavi();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState("");

  const start = (name: string) => {
    setFileName(name);
    setPhase("uploading");
    setProgress(0);
    let p = 0;
    const timer = setInterval(() => {
      p += 12 + Math.random() * 14;
      if (p >= 100) {
        clearInterval(timer);
        setProgress(100);
        updateFloor(floorId, { mapStatus: "processing" });
        setTimeout(() => navigate({ to: "/admin/buildings/$buildingId/floors/$floorId/processing", params: { buildingId, floorId } }), 350);
      } else {
        setProgress(p);
      }
    }, 260);
  };

  return (
    <>
      <Crumbs
        items={[
          { label: "Buildings", to: "/admin/buildings" },
          { label: building?.name ?? "Building", to: "/admin/buildings/$buildingId", params: { buildingId } },
          { label: floor?.name ?? "Floor", to: "/admin/buildings/$buildingId/floors/$floorId", params: { buildingId, floorId } },
          { label: "Upload plan" },
        ]}
      />
      <PageHeader title="Upload floor plan" description={`${floor?.name ?? "This floor"} · PNG, JPG, PDF or SVG · up to 25 MB`} />

      <div className="mt-6 max-w-3xl">
        {phase === "uploading" ? (
          <div className="rounded-xl border border-border bg-card p-8 shadow-1">
            <div className="flex items-center gap-3">
              <FileUp className="h-5 w-5 text-primary" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{fileName}</p>
                <Progress value={progress} className="mt-2 h-2" />
              </div>
              <span className="text-sm numeric text-muted-foreground">{Math.round(progress)}%</span>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">Uploading, then we'll prepare the plan for editing.</p>
          </div>
        ) : phase === "failed" ? (
          <div className="rounded-xl border border-destructive/20 bg-destructive-soft p-8 text-center">
            <AlertCircle className="mx-auto h-8 w-8 text-destructive" aria-hidden />
            <p className="mt-3 text-sm font-semibold text-destructive">That upload didn't finish</p>
            <p className="mt-1 text-sm text-destructive/90">The connection dropped. Nothing was saved.</p>
            <Button className="mt-4" variant="outline" onClick={() => setPhase("idle")}>
              <RotateCcw className="mr-1 h-4 w-4" /> Try again
            </Button>
          </div>
        ) : (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setPhase("dragging");
            }}
            onDragLeave={() => setPhase("idle")}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files?.[0];
              start(f ? f.name : "floor-plan.pdf");
            }}
            className={cn(
              "flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-16 text-center transition-colors",
              phase === "dragging" ? "border-primary bg-info-soft" : "border-border bg-card",
            )}
          >
            <UploadCloud className="h-10 w-10 text-muted-foreground" aria-hidden />
            <p className="mt-4 text-base font-semibold">Drag & drop your floor plan</p>
            <p className="mt-1 text-sm text-muted-foreground">or choose a file from your computer</p>
            <Button className="mt-5" onClick={() => inputRef.current?.click()}>
              Browse files
            </Button>
            <input
              ref={inputRef}
              type="file"
              accept="image/*,.pdf,.svg,.dxf"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) start(f.name);
              }}
            />
            <p className="mt-5 text-xs text-muted-foreground">
              Supported: PNG, JPG, PDF, SVG and selected CAD exports. Max 25 MB.
            </p>
            <button type="button" className="mt-2 text-xs text-muted-foreground underline" onClick={() => setPhase("failed")}>
              Preview the failed-upload state
            </button>
          </div>
        )}
      </div>
    </>
  );
}
