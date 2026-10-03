import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, ScanLine } from "lucide-react";
import { QrGlyph } from "@/components/shared/ui-bits";
import { useNavi } from "@/lib/navisense/store";

export const Route = createFileRoute("/v/")({
  head: () => ({
    meta: [
      { title: "Scan to navigate — NAVISENSE" },
      { name: "description", content: "Scan a NAVISENSE code at any entrance to find rooms, labs and facilities indoors. No app or account needed." },
      { property: "og:title", content: "Scan to navigate — NAVISENSE" },
      { property: "og:description", content: "Indoor navigation in your browser. Scan, search, walk." },
    ],
  }),
  component: ScanEntry,
});

function ScanEntry() {
  const { data } = useNavi();
  const active = data.qrPoints.filter((q) => q.active);

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-background px-5 py-8">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">N</span>
        <span className="text-sm font-semibold">NAVISENSE</span>
      </div>

      <div className="mt-10 flex flex-col items-center text-center">
        <div className="relative flex h-56 w-56 items-center justify-center rounded-2xl border-2 border-dashed border-primary/40 bg-card">
          <ScanLine className="h-16 w-16 text-primary" aria-hidden />
        </div>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight">Scan the code near you</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Codes are placed at entrances and lobbies. Point your phone camera at one to start — no app needed.
        </p>
      </div>

      <div className="mt-10">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Demo: pretend to scan</p>
        <ul className="mt-3 space-y-2">
          {active.map((q) => (
            <li key={q.id}>
              <Link
                to="/v/$qrId"
                params={{ qrId: q.id }}
                className="flex min-h-14 items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-1"
              >
                <QrGlyph value={q.id} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{q.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {data.buildings.find((b) => b.id === q.buildingId)?.name} · {data.floors.find((f) => f.id === q.floorId)?.name}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
