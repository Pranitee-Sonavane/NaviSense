import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Building2, MapPinned, QrCode, Route as RouteIcon, ShieldCheck, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NAVISENSE — GPS-free indoor navigation" },
      {
        name: "description",
        content: "NAVISENSE is an indoor navigation platform: an admin portal to map buildings and a no-login visitor experience to walk people room to room.",
      },
      { property: "og:title", content: "NAVISENSE — GPS-free indoor navigation" },
      { property: "og:description", content: "Map your building once. Visitors scan a code and walk straight to the room they need." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-secondary text-sm font-bold text-secondary-foreground">
              N
            </span>
            <span className="text-[15px] font-semibold tracking-tight">NAVISENSE</span>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link to="/login">Admin log in</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-14 sm:py-20">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Indoor navigation platform</p>
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-[1.1] tracking-tight text-foreground sm:text-5xl">
          Turn a static floor plan into a building people can actually navigate.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
          Facilities teams configure buildings, floors, rooms and walkable paths in one place. Visitors scan a code at
          the entrance and get turn-by-turn directions indoors — no app, no account, no GPS.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link to="/login">
              Open admin portal <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/v">
              <Smartphone className="mr-1 h-4 w-4" /> Try visitor experience
            </Link>
          </Button>
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: Building2, title: "Buildings & floors", body: "Organization → buildings → floors → maps, with per-floor configuration progress." },
            { icon: MapPinned, title: "Spatial map editor", body: "Place rooms, landmarks and walkable paths on a live, zoomable floor canvas." },
            { icon: RouteIcon, title: "Indoor routing", body: "Multi-floor routes with stairs and elevator transitions, previewed before you publish." },
            { icon: ShieldCheck, title: "Validation before launch", body: "Readiness checks catch unreachable rooms and missing entrances early." },
            { icon: QrCode, title: "QR entry points", body: "Generate, print and deactivate location codes for every entrance and lobby." },
            { icon: Smartphone, title: "Zero-friction visitors", body: "Scan, search, walk. No install and no login at any point." },
          ].map((f) => (
            <div key={f.title} className="rounded-xl border border-border bg-card p-5 shadow-1">
              <f.icon className="h-5 w-5 text-primary" aria-hidden />
              <h2 className="mt-3 text-sm font-semibold text-foreground">{f.title}</h2>
              <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>

        <p className="mt-14 rounded-xl border border-border bg-muted/60 p-4 text-sm text-muted-foreground">
          Prototype build: all spatial data, routing and location states use realistic mock data behind a clean
          abstraction, so real localization can be connected later without changing the interface.
        </p>
      </main>
    </div>
  );
}
