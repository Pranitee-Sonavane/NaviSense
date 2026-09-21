import type { Landmark, LandmarkType } from "@/lib/navisense/types";

const GLYPH: Record<LandmarkType, string> = {
  entrance: "⇥",
  reception: "i",
  stairs: "≡",
  elevator: "⇅",
  washroom: "wc",
  cafeteria: "☕",
  information: "i",
  "emergency-exit": "⤢",
};

export function LandmarkGlyph({
  landmark,
  selected,
  onSelect,
}: {
  landmark: Landmark;
  selected?: boolean;
  onSelect?: () => void;
}) {
  const { x, y } = landmark.position;
  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={`Landmark: ${landmark.name}`}
      className="cursor-pointer outline-none"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onSelect?.();
      }}
    >
      <circle
        cx={x}
        cy={y}
        r={selected ? 16 : 13}
        fill="var(--color-accent)"
        stroke={selected ? "var(--color-secondary)" : "#fff"}
        strokeWidth={selected ? 3 : 2}
      />
      <text x={x} y={y + 5} textAnchor="middle" fontSize={13} fontWeight={700} fill="#0b3b37">
        {GLYPH[landmark.type]}
      </text>
      <title>{landmark.name}</title>
    </g>
  );
}
