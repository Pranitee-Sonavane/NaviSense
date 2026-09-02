import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState, type Ref } from "react";
import { Minus, Plus, Crosshair, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ROOM_CATEGORY_LABEL, type Floor, type Id, type Landmark, type NavEdge, type NavNode, type Point, type QrPoint, type Room } from "@/lib/navisense/types";
import { LandmarkGlyph } from "./LandmarkGlyph";

export interface MapLayers {
  rooms: boolean;
  labels: boolean;
  landmarks: boolean;
  network: boolean;
  qr: boolean;
}

export const DEFAULT_LAYERS: MapLayers = {
  rooms: true,
  labels: true,
  landmarks: true,
  network: false,
  qr: false,
};

export interface MapSelection {
  kind: "room" | "landmark" | "node" | "qr";
  id: Id;
}

export interface FloorMapHandle {
  recenter: () => void;
}

interface FloorMapProps {
  floor: Floor | undefined;
  rooms: Room[];
  landmarks: Landmark[];
  nodes: NavNode[];
  edges: NavEdge[];
  qrPoints?: QrPoint[];
  layers?: Partial<MapLayers>;
  selection?: MapSelection | null;
  onSelect?: (sel: MapSelection | null) => void;
  onCanvasClick?: (p: Point) => void;
  routePoints?: Point[];
  locus?: Point | null;
  destination?: Point | null;
  highlightRoomIds?: Id[];
  controls?: boolean;
  className?: string;
  variant?: "admin" | "visitor";
  handleRef?: Ref<FloorMapHandle>;
  ariaLabel?: string;
}

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 6;

export function FloorMap({
  floor,
  rooms,
  landmarks,
  nodes,
  edges,
  qrPoints = [],
  layers,
  selection,
  onSelect,
  onCanvasClick,
  routePoints,
  locus,
  destination,
  highlightRoomIds = [],
  controls = true,
  className,
  variant = "admin",
  handleRef,
  ariaLabel = "Indoor floor map",
}: FloorMapProps) {
  const L = { ...DEFAULT_LAYERS, ...layers };
  const extent = floor?.extent ?? { w: 1000, h: 640 };
  const containerRef = useRef<HTMLDivElement>(null);
  const groupRef = useRef<SVGGElement>(null);
  const [view, setView] = useState({ z: 1, x: 0, y: 0 });
  const dragRef = useRef<{ x: number; y: number; vx: number; vy: number; moved: boolean } | null>(null);
  const viewRef = useRef(view);
  viewRef.current = view;

  const recenter = useCallback(() => setView({ z: 1, x: 0, y: 0 }), []);
  useImperativeHandle(handleRef, () => ({ recenter }), [recenter]);

  // Non-passive wheel listener: React's onWheel is passive and cannot preventDefault.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1);
      const cur = viewRef.current;
      const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, cur.z * Math.exp(-dy * 0.0018)));
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const k = next / cur.z;
      setView({ z: next, x: px - (px - cur.x) * k, y: py - (py - cur.y) * k });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const zoomBy = (factor: number) => {
    const el = containerRef.current;
    const cur = viewRef.current;
    const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, cur.z * factor));
    const px = (el?.clientWidth ?? 0) / 2;
    const py = (el?.clientHeight ?? 0) / 2;
    const k = next / cur.z;
    setView({ z: next, x: px - (px - cur.x) * k, y: py - (py - cur.y) * k });
  };

  const toFloorCoords = (clientX: number, clientY: number): Point | null => {
    const g = groupRef.current;
    if (!g) return null;
    const ctm = g.getScreenCTM();
    if (!ctm) return null;
    const inv = ctm.inverse();
    const pt = new DOMPoint(clientX, clientY).matrixTransform(inv);
    return { x: Math.round(pt.x), y: Math.round(pt.y) };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y, moved: false };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (Math.abs(dx) + Math.abs(dy) > 3) d.moved = true;
    setView((v) => ({ ...v, x: d.vx + dx, y: d.vy + dy }));
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const d = dragRef.current;
    dragRef.current = null;
    if (d && !d.moved) {
      const p = toFloorCoords(e.clientX, e.clientY);
      if (p && onCanvasClick) onCanvasClick(p);
      else if (p && onSelect) onSelect(null);
    }
  };

  const routeD = useMemo(
    () => (routePoints && routePoints.length > 1 ? routePoints.map((p, i) => `${i === 0 ? "M" : "L"}${p.x} ${p.y}`).join(" ") : null),
    [routePoints],
  );
  const routeLen = useMemo(() => {
    if (!routePoints) return 0;
    let t = 0;
    for (let i = 1; i < routePoints.length; i++) t += Math.hypot(routePoints[i].x - routePoints[i - 1].x, routePoints[i].y - routePoints[i - 1].y);
    return Math.round(t);
  }, [routePoints]);

  const isSelected = (kind: MapSelection["kind"], id: Id) => selection?.kind === kind && selection.id === id;
  const highlighted = new Set(highlightRoomIds);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative isolate overflow-hidden rounded-xl border border-border bg-map-canvas touch-none select-none",
        variant === "visitor" && "rounded-none border-0",
        className,
      )}
    >
      <svg
        role="img"
        aria-label={ariaLabel}
        className="h-full w-full animate-[map-in_260ms_ease-out] cursor-grab active:cursor-grabbing"
        viewBox={`0 0 ${extent.w} ${extent.h}`}
        preserveAspectRatio="xMidYMid meet"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => (dragRef.current = null)}
      >
        <defs>
          <pattern id="ns-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M40 0H0V40" fill="none" stroke="var(--color-border)" strokeWidth="0.6" opacity="0.7" />
          </pattern>
        </defs>
        <rect width={extent.w} height={extent.h} fill="url(#ns-grid)" />

        <g ref={groupRef} transform={`translate(${view.x} ${view.y}) scale(${view.z})`}>
          {floor && (
            <>
              <rect
                x={floor.outline.x}
                y={floor.outline.y}
                width={floor.outline.w}
                height={floor.outline.h}
                fill="var(--color-map-corridor)"
                stroke="var(--color-secondary)"
                strokeWidth={3}
                rx={4}
              />
              {floor.corridors.map((c, i) => (
                <rect key={i} x={c.x} y={c.y} width={c.w} height={c.h} fill="var(--color-map-corridor)" stroke="none" />
              ))}
            </>
          )}

          {L.rooms &&
            rooms.map((r) => {
              const active = isSelected("room", r.id) || highlighted.has(r.id);
              return (
                <g
                  key={r.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`${r.name}, ${ROOM_CATEGORY_LABEL[r.category]}`}
                  className="cursor-pointer outline-none"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => onSelect?.({ kind: "room", id: r.id })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") onSelect?.({ kind: "room", id: r.id });
                  }}
                >
                  <rect
                    x={r.rect.x}
                    y={r.rect.y}
                    width={r.rect.w}
                    height={r.rect.h}
                    rx={3}
                    fill={active ? "var(--color-map-room-active)" : "var(--color-map-room)"}
                    stroke={active ? "var(--color-primary)" : "var(--color-map-line)"}
                    strokeWidth={active ? 3 : 1.5}
                  />
                  {L.labels && (
                    <>
                      <text
                        x={r.rect.x + r.rect.w / 2}
                        y={r.rect.y + r.rect.h / 2 - 4}
                        textAnchor="middle"
                        className="map-label pointer-events-none"
                        fill="var(--color-foreground)"
                        fontSize={15}
                        fontWeight={600}
                      >
                        {r.name}
                      </text>
                      <text
                        x={r.rect.x + r.rect.w / 2}
                        y={r.rect.y + r.rect.h / 2 + 16}
                        textAnchor="middle"
                        className="pointer-events-none uppercase"
                        fill="var(--color-muted-foreground)"
                        fontSize={11}
                        letterSpacing={0.6}
                      >
                        {r.number} · {ROOM_CATEGORY_LABEL[r.category]}
                      </text>
                    </>
                  )}
                  <rect x={r.door.x - 14} y={r.door.y - 2.5} width={28} height={5} fill="var(--color-map-corridor)" stroke="var(--color-map-line)" strokeWidth={1} />
                </g>
              );
            })}

          {L.network && (
            <g>
              {edges.map((e) => {
                const a = nodes.find((n) => n.id === e.from);
                const b = nodes.find((n) => n.id === e.to);
                if (!a || !b) return null;
                return (
                  <line
                    key={e.id}
                    x1={a.position.x}
                    y1={a.position.y}
                    x2={b.position.x}
                    y2={b.position.y}
                    stroke="var(--color-primary)"
                    strokeOpacity={0.45}
                    strokeWidth={3}
                    strokeDasharray="8 6"
                  />
                );
              })}
              {nodes.map((n) => (
                <circle
                  key={n.id}
                  cx={n.position.x}
                  cy={n.position.y}
                  r={isSelected("node", n.id) ? 9 : 6}
                  fill={isSelected("node", n.id) ? "var(--color-primary)" : "var(--color-card)"}
                  stroke="var(--color-primary)"
                  strokeWidth={2.5}
                  className="cursor-pointer"
                  onPointerDown={(ev) => ev.stopPropagation()}
                  onClick={() => onSelect?.({ kind: "node", id: n.id })}
                >
                  <title>{n.label}</title>
                </circle>
              ))}
            </g>
          )}

          {L.landmarks &&
            landmarks.map((lm) => (
              <LandmarkGlyph
                key={lm.id}
                landmark={lm}
                selected={isSelected("landmark", lm.id)}
                onSelect={() => onSelect?.({ kind: "landmark", id: lm.id })}
              />
            ))}

          {L.qr &&
            qrPoints.map((q) => {
              const node = nodes.find((n) => n.id === q.entryNodeId);
              if (!node) return null;
              return (
                <g
                  key={q.id}
                  className="cursor-pointer"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => onSelect?.({ kind: "qr", id: q.id })}
                >
                  <rect
                    x={node.position.x - 13}
                    y={node.position.y - 13}
                    width={26}
                    height={26}
                    rx={5}
                    fill="var(--color-secondary)"
                    opacity={q.active ? 1 : 0.4}
                    stroke={isSelected("qr", q.id) ? "var(--color-accent)" : "none"}
                    strokeWidth={3}
                  />
                  <text x={node.position.x} y={node.position.y + 5} textAnchor="middle" fontSize={12} fontWeight={700} fill="#fff">
                    QR
                  </text>
                  <title>{q.name}</title>
                </g>
              );
            })}

          {routeD && (
            <g>
              <path d={routeD} fill="none" stroke="var(--color-accent)" strokeOpacity={0.22} strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" />
              <path
                d={routeD}
                fill="none"
                stroke="var(--color-accent)"
                strokeWidth={6}
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ strokeDasharray: routeLen, strokeDashoffset: 0, animation: `route-draw 600ms ease-out` , ["--route-length" as string]: routeLen }}
              />
            </g>
          )}

          {destination && (
            <g className="pointer-events-none">
              <path
                d={`M${destination.x} ${destination.y} l-11 -17 a13 13 0 1 1 22 0 z`}
                fill="var(--color-destructive)"
                stroke="#fff"
                strokeWidth={2}
              />
              <circle cx={destination.x} cy={destination.y - 24} r={4.5} fill="#fff" />
            </g>
          )}

          {locus && (
            <g className="pointer-events-none">
              <circle cx={locus.x} cy={locus.y} r={10} fill="var(--color-primary)" opacity={0.28} className="origin-center animate-[locus-pulse_2s_ease-out_infinite]" style={{ transformBox: "fill-box" }} />
              <circle cx={locus.x} cy={locus.y} r={11} fill="var(--color-primary)" opacity={0.18} />
              <circle cx={locus.x} cy={locus.y} r={7} fill="var(--color-primary)" stroke="#fff" strokeWidth={3} />
            </g>
          )}
        </g>
      </svg>

      {controls && (
        <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2">
          <MapButton label="Zoom in" onClick={() => zoomBy(1.25)}>
            <Plus className="h-5 w-5" />
          </MapButton>
          <MapButton label="Zoom out" onClick={() => zoomBy(1 / 1.25)}>
            <Minus className="h-5 w-5" />
          </MapButton>
          <MapButton label="Recenter map" onClick={recenter}>
            {variant === "visitor" ? <Crosshair className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
          </MapButton>
        </div>
      )}

      {controls && (
        <div className="pointer-events-none absolute bottom-4 left-4 z-10 rounded-md bg-card/90 px-2 py-1 text-xs numeric text-muted-foreground shadow-1">
          {Math.round(view.z * 100)}%
        </div>
      )}
    </div>
  );
}

function MapButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-2 transition-colors hover:bg-muted"
    >
      {children}
    </button>
  );
}
