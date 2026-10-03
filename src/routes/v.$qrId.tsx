import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownUp,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Camera,
  CheckCircle2,
  Clock,
  CornerUpLeft,
  CornerUpRight,
  Footprints,
  Layers,
  LocateFixed,
  MapPin,
  Search,
  WifiOff,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfidenceBanner, EmptyState } from "@/components/shared/ui-bits";
import { FloorMap, type FloorMapHandle } from "@/components/map/FloorMap";
import { cn } from "@/lib/utils";
import { useNavi } from "@/lib/navisense/store";
import { computeRoute, type NaviRoute, type RouteStep } from "@/lib/navisense/routing";
import { confidenceCopy, IDLE_FIX, mockLocalizationService, type PositionFix } from "@/lib/navisense/localization";
import { LANDMARK_LABEL, ROOM_CATEGORY_LABEL, type Id } from "@/lib/navisense/types";

export const Route = createFileRoute("/v/$qrId")({
  head: () => ({
    meta: [
      { title: "Find your way — NAVISENSE" },
      { name: "description", content: "Search for a room, see the route and follow step-by-step indoor directions." },
      { property: "og:title", content: "Find your way — NAVISENSE" },
      { property: "og:description", content: "Step-by-step indoor navigation, right in your browser." },
    ],
  }),
  component: VisitorApp,
});

type Screen = "landing" | "home" | "place" | "locate" | "preview" | "navigate" | "transition" | "arrived";

interface Destination {
  id: Id;
  kind: "room" | "landmark";
  name: string;
  sub: string;
  floorId: Id;
  nodeId: Id;
  category: string;
  description: string;
  accessibility: string;
}

const CATEGORIES = [
  { label: "Labs", match: (d: Destination) => d.category === "Lab" },
  { label: "Restrooms", match: (d: Destination) => /washroom|restroom/i.test(d.category) },
  { label: "Food", match: (d: Destination) => /cafeteria/i.test(d.category) },
  { label: "Offices", match: (d: Destination) => d.category === "Office" },
  { label: "Help", match: (d: Destination) => /reception|information/i.test(d.category) },
];

function VisitorApp() {
  const { qrId } = Route.useParams();
  const { data } = useNavi();
  const qr = data.qrPoints.find((q) => q.id === qrId);
  const building = data.buildings.find((b) => b.id === qr?.buildingId);
  const org = data.organizations.find((o) => o.id === qr?.orgId);
  const floors = useMemo(
    () => data.floors.filter((f) => f.buildingId === building?.id).sort((a, b) => a.level - b.level),
    [data.floors, building?.id],
  );
  const entryNode = data.nodes.find((n) => n.id === qr?.entryNodeId);

  const destinations = useMemo<Destination[]>(() => {
    const floorIds = new Set(floors.map((f) => f.id));
    const fName = (id: Id) => floors.find((f) => f.id === id)?.name ?? "";
    const rooms = data.rooms
      .filter((r) => floorIds.has(r.floorId) && r.searchable && r.navNodeId)
      .map<Destination>((r) => ({
        id: r.id,
        kind: "room",
        name: r.name,
        sub: `${r.number} · ${fName(r.floorId)}${r.department ? ` · ${r.department}` : ""}`,
        floorId: r.floorId,
        nodeId: r.navNodeId!,
        category: ROOM_CATEGORY_LABEL[r.category],
        description: r.description,
        accessibility: r.accessibility,
      }));
    const lms = data.landmarks
      .filter((l) => floorIds.has(l.floorId) && l.navNodeId)
      .map<Destination>((l) => ({
        id: l.id,
        kind: "landmark",
        name: l.name,
        sub: `${LANDMARK_LABEL[l.type]} · ${fName(l.floorId)}`,
        floorId: l.floorId,
        nodeId: l.navNodeId!,
        category: LANDMARK_LABEL[l.type],
        description: l.description,
        accessibility: "",
      }));
    return [...rooms, ...lms];
  }, [data.rooms, data.landmarks, floors]);

  const [screen, setScreen] = useState<Screen>("landing");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [recent, setRecent] = useState<Id[]>([]);
  const [dest, setDest] = useState<Destination | null>(null);
  const [fix, setFix] = useState<PositionFix>(IDLE_FIX);
  const [startNodeId, setStartNodeId] = useState<Id | null>(null);
  const [stepIdx, setStepIdx] = useState(0);
  const [viewFloorId, setViewFloorId] = useState<Id | null>(qr?.floorId ?? null);
  const [offline, setOffline] = useState(false);
  const mapRef = useRef<FloorMapHandle>(null);

  const route: NaviRoute | null = useMemo(() => {
    if (!dest || !startNodeId) return null;
    return computeRoute(data.nodes, data.edges, floors, startNodeId, dest.nodeId);
  }, [dest, startNodeId, data.nodes, data.edges, floors]);

  if (!qr || !building) {
    return (
      <Shell>
        <div className="p-6">
          <EmptyState
            icon={MapPin}
            title="This code isn't active"
            body="It may have been replaced. Look for another code nearby, or ask at reception."
            action={<Button asChild><Link to="/v">Scan another code</Link></Button>}
          />
        </div>
      </Shell>
    );
  }

  const floorName = (id: Id | null | undefined) => floors.find((f) => f.id === id)?.name ?? "";
  const nodeById = (id: Id | null | undefined) => data.nodes.find((n) => n.id === id);

  const runLocate = (simulate?: "located" | "low-confidence" | "unavailable") => {
    setScreen("locate");
    setFix({ ...IDLE_FIX, status: "locating" });
    mockLocalizationService
      .locate({
        seedNodeId: entryNode?.id,
        seedFloorId: qr.floorId,
        seedPosition: entryNode?.position,
        seedLabel: qr.name,
        simulate,
      })
      .then((f) => {
        setFix(f);
        if (f.nodeId) setStartNodeId(f.nodeId);
      });
  };

  const choose = (d: Destination) => {
    setDest(d);
    setRecent((r) => [d.id, ...r.filter((x) => x !== d.id)].slice(0, 4));
    setScreen("place");
  };

  const floorMapFor = (floorId: Id | null) => {
    const f = floors.find((x) => x.id === floorId);
    return {
      floor: f,
      rooms: data.rooms.filter((r) => r.floorId === floorId),
      landmarks: data.landmarks.filter((l) => l.floorId === floorId),
      nodes: data.nodes.filter((n) => n.floorId === floorId),
      edges: [],
    };
  };

  /* ------------------------------- landing ------------------------------- */
  if (screen === "landing") {
    return (
      <Shell>
        <div className="flex flex-1 flex-col px-5 pb-6 pt-10">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Welcome to</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">{org?.name}</h1>
          <div className="mt-6 rounded-xl border border-border bg-card p-4 shadow-1">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-info-soft text-info">
                <MapPin className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <p className="text-sm font-semibold">{building.name}</p>
                <p className="text-sm text-muted-foreground">
                  {floorName(qr.floorId)} · {qr.name}
                </p>
              </div>
            </div>
          </div>
          <div className="relative mt-6 h-56 overflow-hidden rounded-xl border border-border">
            <FloorMap {...floorMapFor(qr.floorId)} controls={false} variant="visitor" locus={entryNode?.position} ariaLabel="Floor overview" className="h-full" />
          </div>
          <div className="mt-auto pt-8">
            <Button size="lg" className="h-14 w-full text-base" onClick={() => setScreen("home")}>
              Find a place
            </Button>
            <p className="mt-3 text-center text-xs text-muted-foreground">No app or sign-in needed.</p>
          </div>
        </div>
      </Shell>
    );
  }

  /* ------------------------------ search/home ----------------------------- */
  if (screen === "home") {
    const q = query.trim().toLowerCase();
    const results = destinations.filter((d) => {
      if (category) {
        const c = CATEGORIES.find((x) => x.label === category);
        if (c && !c.match(d)) return false;
      }
      if (!q) return true;
      return `${d.name} ${d.sub} ${d.category}`.toLowerCase().includes(q);
    });
    const showResults = q.length > 0 || category;
    const suggestions = ["AI Lab 201", "Library", "Reception", "Cafeteria", "Elevator A"]
      .map((n) => destinations.find((d) => d.name === n))
      .filter(Boolean) as Destination[];
    const recentItems = recent.map((id) => destinations.find((d) => d.id === id)).filter(Boolean) as Destination[];

    return (
      <Shell>
        <div className="sticky top-0 z-10 border-b border-border bg-background px-4 pb-3 pt-4">
          <div className="flex items-center gap-2">
            <button type="button" aria-label="Back" onClick={() => setScreen("landing")} className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-muted">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Room, department or facility"
                aria-label="Search destinations"
                className="h-12 rounded-full pl-9 pr-10 text-base"
              />
              {query && (
                <button type="button" aria-label="Clear search" onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Categories">
            {CATEGORIES.map((c) => (
              <button
                key={c.label}
                type="button"
                aria-pressed={category === c.label}
                onClick={() => setCategory(category === c.label ? null : c.label)}
                className={cn(
                  "min-h-9 shrink-0 rounded-full border px-3.5 text-sm font-medium",
                  category === c.label ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card",
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 px-4 py-4">
          {offline && (
            <div className="mb-4">
              <ConfidenceBanner tone="warning" title="You're offline" body="Saved maps still work. Search results may be out of date." />
            </div>
          )}
          {showResults ? (
            results.length === 0 ? (
              <div className="px-2 py-12 text-center">
                <p className="text-base font-semibold">No places match “{query}”</p>
                <p className="mt-1 text-sm text-muted-foreground">Try a room number like 204, or a word like “lab”.</p>
                <Button variant="outline" className="mt-4" onClick={() => { setQuery(""); setCategory(null); }}>
                  Clear search
                </Button>
              </div>
            ) : (
              <>
                <p className="mb-2 text-xs text-muted-foreground">{results.length} places</p>
                <ResultList items={results} onPick={choose} />
              </>
            )
          ) : (
            <>
              {recentItems.length > 0 && (
                <section className="mb-6">
                  <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Recent</h2>
                  <ResultList items={recentItems} onPick={choose} />
                </section>
              )}
              <section>
                <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Popular here</h2>
                <ResultList items={suggestions} onPick={choose} />
              </section>
              <div className="mt-6 flex flex-wrap gap-2">
                <button type="button" onClick={() => setOffline((o) => !o)} className="flex items-center gap-1.5 text-xs text-muted-foreground underline">
                  <WifiOff className="h-3.5 w-3.5" /> {offline ? "Back online (demo)" : "Preview offline state"}
                </button>
              </div>
            </>
          )}
        </div>
      </Shell>
    );
  }

  /* ------------------------------ place details --------------------------- */
  if (screen === "place" && dest) {
    const destNode = nodeById(dest.nodeId);
    return (
      <Shell>
        <div className="relative h-[45vh] min-h-64">
          <FloorMap {...floorMapFor(dest.floorId)} variant="visitor" destination={destNode?.position} highlightRoomIds={dest.kind === "room" ? [dest.id] : []} className="h-full" ariaLabel={`Map showing ${dest.name}`} />
          <BackButton onClick={() => setScreen("home")} />
        </div>
        <div className="-mt-4 flex flex-1 flex-col rounded-t-2xl bg-card px-5 pb-6 pt-5 shadow-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{dest.category}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{dest.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{dest.sub}</p>
          {dest.description && <p className="mt-4 text-sm">{dest.description}</p>}
          {dest.accessibility && (
            <p className="mt-3 rounded-lg bg-muted px-3 py-2 text-sm">
              <span className="font-medium">Access: </span>
              {dest.accessibility}
            </p>
          )}
          <div className="mt-auto pt-6">
            <Button size="lg" className="h-14 w-full text-base" onClick={() => (startNodeId ? setScreen("preview") : runLocate())}>
              Get directions
            </Button>
          </div>
        </div>
      </Shell>
    );
  }

  /* -------------------------------- locate me ----------------------------- */
  if (screen === "locate") {
    const copy = confidenceCopy(fix);
    return (
      <Shell>
        <div className="relative h-[50vh] min-h-64">
          <FloorMap {...floorMapFor(qr.floorId)} variant="visitor" controls={false} locus={fix.status === "located" || fix.status === "low-confidence" ? fix.position : null} className="h-full" ariaLabel="Your location" />
          <BackButton onClick={() => setScreen(dest ? "place" : "home")} />
          {fix.status === "locating" && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/40">
              <span className="relative flex h-20 w-20 items-center justify-center">
                <span className="absolute inset-0 animate-ping rounded-full bg-primary/30" />
                <LocateFixed className="relative h-8 w-8 text-primary" aria-hidden />
              </span>
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col px-5 pb-6 pt-5" aria-live="polite">
          <ConfidenceBanner tone={copy.tone} title={copy.title} body={copy.body} />
          <div className="mt-auto space-y-2 pt-6">
            {fix.status === "located" && (
              <Button size="lg" className="h-14 w-full text-base" onClick={() => setScreen(dest ? "preview" : "home")}>
                {dest ? "See route" : "Continue"}
              </Button>
            )}
            {fix.status === "low-confidence" && (
              <>
                <Button size="lg" className="h-14 w-full text-base" onClick={() => setScreen(dest ? "preview" : "home")}>
                  Continue anyway
                </Button>
                <Button size="lg" variant="outline" className="h-12 w-full" onClick={() => runLocate()}>
                  Try again
                </Button>
              </>
            )}
            {fix.status === "unavailable" && (
              <>
                <Button
                  size="lg"
                  className="h-14 w-full text-base"
                  onClick={() => {
                    setStartNodeId(entryNode?.id ?? null);
                    setFix({ ...fix, status: "located", confidence: 1, position: entryNode?.position ?? null, label: qr.name, nodeId: entryNode?.id ?? null, floorId: qr.floorId });
                  }}
                >
                  Start from {qr.name}
                </Button>
                <Button size="lg" variant="outline" className="h-12 w-full" onClick={() => runLocate()}>
                  Try again
                </Button>
                <Button variant="ghost" className="w-full" asChild>
                  <Link to="/v">Scan a nearby code</Link>
                </Button>
              </>
            )}
            {fix.status !== "locating" && (
              <div className="flex justify-center gap-3 pt-2 text-xs text-muted-foreground">
                <span>Demo:</span>
                <button className="underline" onClick={() => runLocate("located")}>found</button>
                <button className="underline" onClick={() => runLocate("low-confidence")}>low accuracy</button>
                <button className="underline" onClick={() => runLocate("unavailable")}>not found</button>
              </div>
            )}
          </div>
        </div>
      </Shell>
    );
  }

  /* ------------------------------ route preview --------------------------- */
  if (screen === "preview" && dest) {
    if (!route) {
      return (
        <Shell>
          <div className="p-6">
            <EmptyState icon={MapPin} title="No route available" body="This place isn't connected to a walkable path yet. Please ask at reception." action={<Button onClick={() => setScreen("home")}>Choose another place</Button>} />
          </div>
        </Shell>
      );
    }
    const firstLeg = route.legs[0];
    return (
      <Shell>
        <div className="relative h-[52vh] min-h-72">
          <FloorMap
            {...floorMapFor(firstLeg.floorId)}
            variant="visitor"
            routePoints={firstLeg.points}
            locus={firstLeg.points[0]}
            destination={route.legs.length === 1 ? firstLeg.points[firstLeg.points.length - 1] : null}
            className="h-full"
            ariaLabel="Route preview"
          />
          <BackButton onClick={() => setScreen("place")} />
        </div>
        <div className="-mt-4 flex flex-1 flex-col rounded-t-2xl bg-card px-5 pb-6 pt-5 shadow-2">
          <div className="flex items-center gap-3 text-sm">
            <span className="h-3 w-3 rounded-full bg-primary" aria-hidden />
            <span className="truncate">{fix.label ?? qr.name}</span>
          </div>
          <div className="ml-1.5 h-4 border-l-2 border-dashed border-border" aria-hidden />
          <div className="flex items-center gap-3 text-sm font-semibold">
            <MapPin className="h-3.5 w-3.5 text-destructive" aria-hidden />
            <span className="truncate">{dest.name}</span>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2 text-center">
            <Metric icon={Clock} value={`${Math.max(1, Math.round(route.minutes))} min`} label="Walk" />
            <Metric icon={Footprints} value={`${Math.round(route.distance)} m`} label="Distance" />
            <Metric icon={Layers} value={route.floorChanges ? `${route.floorChanges}` : "Same"} label={route.floorChanges ? "Floor change" : "Floor"} />
          </div>
          {route.floorChanges > 0 && (
            <p className="mt-4 rounded-lg bg-info-soft px-3 py-2 text-sm text-info">
              Goes from {floorName(route.legs[0].floorId)} to {floorName(route.legs[route.legs.length - 1].floorId)}.
            </p>
          )}
          <div className="mt-auto pt-6">
            <Button
              size="lg"
              className="h-14 w-full text-base"
              onClick={() => {
                setStepIdx(0);
                setViewFloorId(route.legs[0].floorId);
                setScreen("navigate");
              }}
            >
              Start navigation
            </Button>
          </div>
        </div>
      </Shell>
    );
  }

  /* --------------------------- floor transition --------------------------- */
  if (screen === "transition" && route && dest) {
    const step = route.steps[stepIdx];
    const nextStep = route.steps[stepIdx + 1];
    const targetFloor = nextStep?.floorId ?? step.floorId;
    const isElevator = step.kind === "elevator";
    return (
      <Shell dark>
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <span className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/20">
            <ArrowDownUp className="h-10 w-10 animate-bounce text-primary-foreground" aria-hidden />
          </span>
          <p className="mt-8 text-sm uppercase tracking-wide opacity-70">{isElevator ? "Take the elevator" : "Take the stairs"}</p>
          <p className="instruction-text mt-2 font-semibold">Go to {floorName(targetFloor)}</p>
          <div className="mt-6 flex items-center gap-3 text-sm opacity-80">
            <span>{floorName(step.floorId)}</span>
            <ArrowRight className="h-4 w-4" aria-hidden />
            <span className="font-semibold">{floorName(targetFloor)}</span>
          </div>
          <p className="mt-6 max-w-xs text-sm opacity-70">Then continue to {dest.name}. We'll update the map when you arrive.</p>
        </div>
        <div className="space-y-2 px-5 pb-8">
          <Button
            size="lg"
            className="h-14 w-full text-base"
            onClick={() => {
              const next = Math.min(stepIdx + 1, route.steps.length - 1);
              setStepIdx(next);
              setViewFloorId(route.steps[next].floorId);
              setScreen(route.steps[next].kind === "arrive" ? "arrived" : "navigate");
            }}
          >
            I'm on {floorName(targetFloor)}
          </Button>
          <Button variant="ghost" className="w-full opacity-80" onClick={() => setScreen("navigate")}>
            Back to map
          </Button>
        </div>
      </Shell>
    );
  }

  /* ------------------------------- navigation ----------------------------- */
  if (screen === "navigate" && route && dest) {
    const step = route.steps[stepIdx];
    const next = route.steps[stepIdx + 1];
    const floorId = viewFloorId ?? step.floorId;
    const leg = route.legs.find((l) => l.floorId === floorId);
    const doneDist = route.steps.slice(0, stepIdx).reduce((s, x) => s + x.distance, 0);
    const remaining = Math.max(0, Math.round(route.distance - doneDist));
    const pct = route.distance ? Math.round((doneDist / route.distance) * 100) : 0;
    const locusNode = nodeById(stepIdx === 0 ? startNodeId : route.steps[stepIdx - 1].toNodeId);
    const routeFloors = Array.from(new Set(route.legs.map((l) => l.floorId)));
    const isLastFloor = floorId === route.legs[route.legs.length - 1].floorId;

    const advance = () => {
      if (step.kind === "stairs" || step.kind === "elevator") {
        setScreen("transition");
        return;
      }
      const n = stepIdx + 1;
      if (n >= route.steps.length || route.steps[n].kind === "arrive") {
        setScreen("arrived");
        return;
      }
      setStepIdx(n);
      setViewFloorId(route.steps[n].floorId);
    };

    return (
      <Shell>
        <div className="bg-secondary px-5 pb-5 pt-5 text-secondary-foreground">
          <div className="flex items-start gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <StepIcon step={step} />
            </span>
            <div className="min-w-0">
              <p className="instruction-text font-semibold" aria-live="polite">{step.instruction}</p>
              <p className="mt-1 text-sm opacity-75">{step.detail}</p>
            </div>
          </div>
          {next && (
            <p className="mt-3 text-xs opacity-70">
              Then: {next.instruction}
            </p>
          )}
        </div>

        <div className="relative flex-1 min-h-[45vh]">
          <FloorMap
            handleRef={mapRef}
            {...floorMapFor(floorId)}
            variant="visitor"
            routePoints={leg?.points}
            locus={locusNode?.floorId === floorId ? locusNode.position : null}
            destination={isLastFloor ? nodeById(dest.nodeId)?.position : null}
            className="absolute inset-0 h-full"
            ariaLabel={`Navigation map, ${floorName(floorId)}`}
          />
          <div className="absolute left-3 top-3 z-10 flex flex-col overflow-hidden rounded-lg border border-border bg-card shadow-2" role="group" aria-label="Floor">
            {[...routeFloors].reverse().map((fid) => (
              <button
                key={fid}
                type="button"
                aria-pressed={fid === floorId}
                onClick={() => setViewFloorId(fid)}
                className={cn("min-h-11 px-3 text-xs font-semibold", fid === floorId ? "bg-primary text-primary-foreground" : "hover:bg-muted")}
              >
                {floorName(fid).replace("Ground Floor", "G").replace("Floor ", "F")}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setScreen("preview")}
            aria-label="End navigation"
            className="absolute right-3 top-3 z-10 flex h-11 items-center gap-1 rounded-full border border-border bg-card px-3 text-sm font-medium shadow-2"
          >
            <X className="h-4 w-4" /> End
          </button>
        </div>

        <div className="border-t border-border bg-card px-5 pb-6 pt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="numeric font-semibold">{remaining} m left</span>
            <span className="text-muted-foreground">
              {floorName(floorId)} · {dest.name}
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full bg-accent transition-all" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-4 flex gap-2">
            <Button variant="outline" size="lg" className="h-12" aria-label="Recenter" onClick={() => { setViewFloorId(step.floorId); mapRef.current?.recenter(); }}>
              <LocateFixed className="h-5 w-5" />
            </Button>
            <Button size="lg" className="h-12 flex-1 text-base" onClick={advance}>
              {step.kind === "stairs" || step.kind === "elevator" ? "Change floor" : "Next step"}
            </Button>
          </div>
          <button type="button" className="mt-3 flex w-full items-center justify-center gap-1.5 text-xs text-muted-foreground" disabled>
            <Camera className="h-3.5 w-3.5" /> Camera guidance — coming soon
          </button>
        </div>
      </Shell>
    );
  }

  /* -------------------------------- arrived ------------------------------- */
  if (screen === "arrived" && dest) {
    return (
      <Shell>
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-success-soft">
            <CheckCircle2 className="h-10 w-10 text-success" aria-hidden />
          </span>
          <h1 className="mt-6 text-2xl font-semibold tracking-tight">You've arrived</h1>
          <p className="mt-2 text-base">{dest.name}</p>
          <p className="text-sm text-muted-foreground">{dest.sub}</p>
        </div>
        <div className="space-y-2 px-5 pb-8">
          <Button
            size="lg"
            className="h-14 w-full text-base"
            onClick={() => {
              setStartNodeId(dest.nodeId);
              setFix((f) => ({ ...f, label: dest.name, nodeId: dest.nodeId, floorId: dest.floorId, position: nodeById(dest.nodeId)?.position ?? null }));
              setDest(null);
              setQuery("");
              setScreen("home");
            }}
          >
            Find another place
          </Button>
          <Button size="lg" variant="outline" className="h-12 w-full" onClick={() => setScreen("landing")}>
            Done
          </Button>
        </div>
      </Shell>
    );
  }

  // Fallback: unexpected state → home
  return (
    <Shell>
      <div className="p-6">
        <Button onClick={() => setScreen("home")}>Back to search</Button>
      </div>
    </Shell>
  );
}

/* --------------------------------- pieces --------------------------------- */

function Shell({ children, dark }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <div className={cn("min-h-screen", dark ? "bg-secondary text-secondary-foreground" : "bg-background")}>
      <div className="mx-auto flex min-h-screen max-w-md flex-col md:max-w-lg md:border-x md:border-border">{children}</div>
    </div>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label="Back"
      onClick={onClick}
      className="absolute left-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card shadow-2"
    >
      <ArrowLeft className="h-5 w-5" />
    </button>
  );
}

function Metric({ icon: Icon, value, label }: { icon: typeof Clock; value: string; label: string }) {
  return (
    <div className="rounded-lg border border-border px-2 py-3">
      <Icon className="mx-auto h-4 w-4 text-muted-foreground" aria-hidden />
      <p className="mt-1 text-base font-semibold numeric">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function StepIcon({ step }: { step: RouteStep }) {
  const cls = "h-7 w-7";
  switch (step.kind) {
    case "left":
      return <CornerUpLeft className={cls} aria-hidden />;
    case "right":
      return <CornerUpRight className={cls} aria-hidden />;
    case "stairs":
    case "elevator":
      return <ArrowDownUp className={cls} aria-hidden />;
    case "arrive":
      return <MapPin className={cls} aria-hidden />;
    default:
      return <ArrowUp className={cls} aria-hidden />;
  }
}

function ResultList({ items, onPick }: { items: Destination[]; onPick: (d: Destination) => void }) {
  return (
    <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
      {items.map((d) => (
        <li key={d.id}>
          <button type="button" onClick={() => onPick(d)} className="flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
              <MapPin className="h-4 w-4 text-muted-foreground" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{d.name}</span>
              <span className="block truncate text-xs text-muted-foreground">{d.sub}</span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
