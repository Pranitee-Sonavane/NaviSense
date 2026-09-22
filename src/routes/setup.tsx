import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, MapPinned, QrCode, ShieldCheck, Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { StatusPill, QrGlyph } from "@/components/shared/ui-bits";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/setup")({
  head: () => ({
    meta: [
      { title: "Setup wizard — NAVISENSE" },
      { name: "description", content: "Seven guided steps to take a NAVISENSE organization from empty to a published, navigable building." },
      { property: "og:title", content: "Setup wizard — NAVISENSE" },
      { property: "og:description", content: "Organization, buildings, floor plans, rooms, validation and QR deployment in one guided flow." },
    ],
  }),
  component: SetupWizard,
});

const STEPS = [
  "Organization",
  "Building",
  "Floor plans",
  "Map configuration",
  "Rooms & landmarks",
  "Validation",
  "QR deployment",
];

function SetupWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const last = step === STEPS.length - 1;

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-lg rounded-xl border border-border bg-card p-8 text-center shadow-1">
          <CheckCircle2 className="mx-auto h-12 w-12 text-success" aria-hidden />
          <h1 className="mt-4 text-xl font-semibold">Your building is ready</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Engineering Block is configured and published. Visitors scanning your entrance code can now navigate indoors.
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button asChild>
              <Link to="/admin">Go to dashboard</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/v">View visitor experience</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-card">
        <div className="mx-auto max-w-5xl px-5 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-secondary text-sm font-bold text-secondary-foreground">N</span>
              <span className="text-sm font-semibold tracking-tight">NAVISENSE setup</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                toast.success("Progress saved. You can finish setup later.");
                navigate({ to: "/admin" });
              }}
            >
              Save & exit
            </Button>
          </div>

          <ol className="mt-4 hidden items-center gap-1 md:flex">
            {STEPS.map((label, i) => (
              <li key={label} className="flex flex-1 items-center gap-2">
                <button
                  type="button"
                  onClick={() => i <= step && setStep(i)}
                  disabled={i > step}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
                    i === step && "text-primary",
                    i < step && "text-success hover:bg-muted",
                    i > step && "cursor-not-allowed text-muted-foreground",
                  )}
                  aria-current={i === step ? "step" : undefined}
                >
                  <span
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full border text-[11px]",
                      i === step && "border-primary bg-primary text-primary-foreground",
                      i < step && "border-success bg-success text-success-foreground",
                      i > step && "border-border",
                    )}
                  >
                    {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
                  </span>
                  <span className="hidden lg:inline">{label}</span>
                </button>
                {i < STEPS.length - 1 && <span className="h-px flex-1 bg-border" aria-hidden />}
              </li>
            ))}
          </ol>

          <div className="mt-4 md:hidden">
            <p className="text-sm font-medium">
              Step {step + 1} of {STEPS.length} · {STEPS[step]}
            </p>
            <Progress value={((step + 1) / STEPS.length) * 100} className="mt-2 h-1.5" />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-10">
        <h1 className="text-2xl font-semibold tracking-tight">{STEPS[step]}</h1>
        <div className="mt-6 rounded-xl border border-border bg-card p-6 shadow-1">
          <StepBody step={step} />
        </div>

        <div className="mt-6 flex items-center justify-between">
          <Button variant="outline" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
            <ArrowLeft className="mr-1 h-4 w-4" /> Back
          </Button>
          <Button
            onClick={() => {
              if (last) setDone(true);
              else setStep((s) => s + 1);
            }}
          >
            {last ? "Finish setup" : "Continue"} <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </main>
    </div>
  );
}

function StepBody({ step }: { step: number }) {
  switch (step) {
    case 0:
      return (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Confirm the details visitors will see at the top of their screen.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="org" label="Organization name" defaultValue="North Valley Institute" />
            <div className="space-y-2">
              <Label htmlFor="otype">Type</Label>
              <Select defaultValue="education">
                <SelectTrigger id="otype"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="education">Education / campus</SelectItem>
                  <SelectItem value="hospital">Hospital</SelectItem>
                  <SelectItem value="office">Office</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Field id="site" label="Website" defaultValue="northvalley.edu" />
            <Field id="addr" label="Address" defaultValue="12 Ridge Road, North Valley" />
          </div>
        </div>
      );
    case 1:
      return (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Start with one building. You can add more at any time.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="b-name" label="Building name" defaultValue="Engineering Block" />
            <Field id="b-type" label="Building type" defaultValue="Academic" />
            <Field id="b-floors" label="Number of floors" defaultValue="4" type="number" />
            <Field id="b-addr" label="Address" defaultValue="12 Ridge Road" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="b-desc">Description</Label>
            <Textarea id="b-desc" rows={3} defaultValue="Four-floor academic block housing CS, Electronics and shared facilities." />
          </div>
        </div>
      );
    case 2:
      return (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Upload one plan per floor. Images, PDF and SVG are supported, up to 25 MB each.</p>
          {["Ground Floor", "Floor 1", "Floor 2", "Floor 3"].map((f, i) => (
            <div key={f} className="flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-3">
              <div className="flex items-center gap-3">
                <Upload className="h-4 w-4 text-muted-foreground" aria-hidden />
                <span className="text-sm font-medium">{f}</span>
              </div>
              <StatusPill tone={i < 3 ? "success" : "warning"}>{i < 3 ? "Uploaded" : "Needs upload"}</StatusPill>
            </div>
          ))}
        </div>
      );
    case 3:
      return (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            We've read each plan and suggested rooms, corridors and doors. Nothing is accepted until you confirm it.
          </p>
          {[
            ["Rooms detected", "32", "success"],
            ["Corridors detected", "8", "success"],
            ["Doors detected", "41", "warning"],
            ["Text labels read", "29", "warning"],
          ].map(([label, value, tone]) => (
            <div key={label} className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
              <span className="text-sm">{label}</span>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold numeric">{value}</span>
                <StatusPill tone={tone as "success" | "warning"}>{tone === "success" ? "Confirmed" : "Needs review"}</StatusPill>
              </div>
            </div>
          ))}
        </div>
      );
    case 4:
      return (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Name the places visitors will search for, and mark the landmarks they navigate by.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {["Reception", "CS Lab 101", "AI Lab 201", "Main Auditorium", "Library", "Cafeteria"].map((r) => (
              <div key={r} className="flex items-center gap-2 rounded-lg border border-border px-3 py-2.5 text-sm">
                <MapPinned className="h-4 w-4 text-primary" aria-hidden /> {r}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            {["Main Entrance", "Reception", "Elevator A", "Staircase A", "Washrooms", "Information Desk"].map((l) => (
              <StatusPill key={l} tone="info" icon={false}>{l}</StatusPill>
            ))}
          </div>
        </div>
      );
    case 5:
      return (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Final checks before visitors can use this building.</p>
          {[
            ["All floors configured", "pass"],
            ["Main entrance configured", "pass"],
            ["Rooms named", "pass"],
            ["Paths connected", "pass"],
            ["Stairs and elevator linked across floors", "pass"],
            ["Floor 3 has 2 rooms needing review", "warn"],
          ].map(([label, level]) => (
            <div key={label} className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
              <span className="flex items-center gap-2 text-sm">
                <ShieldCheck className="h-4 w-4 text-muted-foreground" aria-hidden />
                {label}
              </span>
              <StatusPill tone={level === "pass" ? "success" : "warning"}>{level === "pass" ? "Passed" : "Needs review"}</StatusPill>
            </div>
          ))}
        </div>
      );
    default:
      return (
        <div className="flex flex-col items-center gap-4 text-center">
          <QrGlyph value="navisense:org-nvi/bld-engineering/f0/entrance" size={168} />
          <div>
            <p className="flex items-center justify-center gap-2 text-sm font-semibold">
              <QrCode className="h-4 w-4" aria-hidden /> Main Entrance · Engineering Block
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Print this and place it at the entrance. Visitors scan it to start navigating.
            </p>
          </div>
          <Button variant="outline" onClick={() => toast.success("QR poster downloaded (demo).")}>
            Download poster
          </Button>
        </div>
      );
  }
}

function Field({ id, label, defaultValue, type = "text" }: { id: string; label: string; defaultValue?: string; type?: string }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} defaultValue={defaultValue} />
    </div>
  );
}
