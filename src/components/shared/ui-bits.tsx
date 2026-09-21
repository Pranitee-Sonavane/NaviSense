import { Link } from "@tanstack/react-router";
import { AlertTriangle, CheckCircle2, CircleDashed, Info, XCircle, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/* -------------------------------- status pill -------------------------------- */

export type Tone = "neutral" | "info" | "success" | "warning" | "error";

const TONE_CLASS: Record<Tone, string> = {
  neutral: "bg-muted text-muted-foreground border-border",
  info: "bg-info-soft text-info border-info/20",
  success: "bg-success-soft text-success border-success/20",
  warning: "bg-warning-soft text-warning border-warning/25",
  error: "bg-destructive-soft text-destructive border-destructive/20",
};

const TONE_ICON: Record<Tone, LucideIcon> = {
  neutral: CircleDashed,
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
};

export function StatusPill({
  tone = "neutral",
  children,
  icon = true,
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  icon?: boolean;
  className?: string;
}) {
  const Icon = TONE_ICON[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium",
        TONE_CLASS[tone],
        className,
      )}
    >
      {icon && <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />}
      {children}
    </span>
  );
}

/* -------------------------------- empty state -------------------------------- */

export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card px-6 py-14 text-center", className)}>
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Icon className="h-6 w-6 text-muted-foreground" aria-hidden />
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* ---------------------------------- stat card --------------------------------- */

export function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  tone = "neutral",
}: {
  label: string;
  value: ReactNode;
  sub?: string;
  icon: LucideIcon;
  tone?: Tone;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-1">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-semibold numeric text-foreground">{value}</p>
          {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
        </div>
        <span className={cn("flex h-10 w-10 items-center justify-center rounded-lg border", TONE_CLASS[tone])}>
          <Icon className="h-5 w-5" aria-hidden />
        </span>
      </div>
    </div>
  );
}

/* --------------------------------- page header -------------------------------- */

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/* --------------------------------- breadcrumbs -------------------------------- */

export interface Crumb {
  label: string;
  to?: string;
  params?: Record<string, string>;
}

export function Crumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
      {items.map((c, i) => (
        <span key={`${c.label}-${i}`} className="flex items-center gap-1.5">
          {i > 0 && <span aria-hidden>/</span>}
          {c.to ? (
            <Link to={c.to} params={c.params as never} className="rounded hover:text-foreground hover:underline">
              {c.label}
            </Link>
          ) : (
            <span className="font-medium text-foreground">{c.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

/* ------------------------------- confidence strip ------------------------------ */

export function ConfidenceBanner({ tone, title, body, actions }: { tone: Tone; title: string; body: string; actions?: ReactNode }) {
  const Icon = TONE_ICON[tone];
  return (
    <div className={cn("flex items-start gap-3 rounded-xl border px-4 py-3", TONE_CLASS[tone])}>
      <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-0.5 text-sm opacity-90">{body}</p>
        {actions && <div className="mt-3 flex flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  );
}

/* ---------------------------------- mock QR ----------------------------------- */

export function QrGlyph({ value, size = 160, className }: { value: string; size?: number; className?: string }) {
  const cells = 21;
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const rand = (i: number) => {
    let x = Math.imul(h ^ (i * 2654435761), 2246822519);
    x ^= x >>> 15;
    return ((x >>> 0) % 1000) / 1000;
  };
  const isFinder = (r: number, c: number) =>
    (r < 7 && c < 7) || (r < 7 && c >= cells - 7) || (r >= cells - 7 && c < 7);

  const rects: ReactNode[] = [];
  for (let r = 0; r < cells; r++) {
    for (let c = 0; c < cells; c++) {
      if (isFinder(r, c)) continue;
      if (rand(r * cells + c) > 0.54) {
        rects.push(<rect key={`${r}-${c}`} x={c} y={r} width={1} height={1} fill="currentColor" />);
      }
    }
  }
  const finder = (x: number, y: number) => (
    <g key={`f-${x}-${y}`}>
      <rect x={x} y={y} width={7} height={7} fill="currentColor" />
      <rect x={x + 1} y={y + 1} width={5} height={5} fill="var(--color-card)" />
      <rect x={x + 2} y={y + 2} width={3} height={3} fill="currentColor" />
    </g>
  );

  return (
    <svg
      role="img"
      aria-label={`QR code for ${value}`}
      viewBox={`-1 -1 ${cells + 2} ${cells + 2}`}
      width={size}
      height={size}
      className={cn("text-secondary", className)}
    >
      <rect x={-1} y={-1} width={cells + 2} height={cells + 2} fill="var(--color-card)" />
      {finder(0, 0)}
      {finder(cells - 7, 0)}
      {finder(0, cells - 7)}
      {rects}
    </svg>
  );
}
