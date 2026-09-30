import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Download, Plus, Printer, QrCode, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState, PageHeader, QrGlyph, StatusPill } from "@/components/shared/ui-bits";
import { useNavi, useOrg } from "@/lib/navisense/store";

export const Route = createFileRoute("/admin/qr/")({
  head: () => ({
    meta: [
      { title: "QR codes — NAVISENSE admin" },
      { name: "description", content: "Generate, preview, print and disable the QR codes visitors scan at each entry point." },
      { property: "og:title", content: "QR codes — NAVISENSE admin" },
      { property: "og:description", content: "Manage QR entry points for your buildings." },
    ],
  }),
  component: QrManagement,
});

function QrManagement() {
  const org = useOrg();
  const { data, updateQr, removeQr } = useNavi();
  const qrs = data.qrPoints.filter((q) => q.orgId === org.id);
  const [preview, setPreview] = useState<string | null>(null);
  const previewQr = qrs.find((q) => q.id === preview);

  const where = (buildingId: string, floorId: string) =>
    `${data.buildings.find((b) => b.id === buildingId)?.name ?? "—"} · ${data.floors.find((f) => f.id === floorId)?.name ?? "—"}`;

  return (
    <>
      <PageHeader
        title="QR codes"
        description="Each code drops a visitor at a known entry point: organization → building → floor → entry point."
        actions={
          <Button asChild>
            <Link to="/admin/qr/new">
              <Plus className="mr-1 h-4 w-4" /> Generate QR
            </Link>
          </Button>
        }
      />

      <div className="mt-6">
        {qrs.length === 0 ? (
          <EmptyState
            icon={QrCode}
            title="No QR codes yet"
            body="Generate one for each entrance so visitors can start navigating instantly."
            action={<Button asChild><Link to="/admin/qr/new">Generate QR</Link></Button>}
          />
        ) : (
          <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {qrs.map((q) => (
              <li key={q.id} className="rounded-xl border border-border bg-card p-5 shadow-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{q.name}</p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{where(q.buildingId, q.floorId)}</p>
                  </div>
                  <StatusPill tone={q.active ? "success" : "neutral"}>{q.active ? "Active" : "Disabled"}</StatusPill>
                </div>

                <button
                  type="button"
                  onClick={() => setPreview(q.id)}
                  className="mt-4 flex w-full justify-center rounded-lg border border-border bg-background py-4"
                  aria-label={`Preview ${q.name}`}
                >
                  <QrGlyph value={q.id} size={120} />
                </button>

                <p className="mt-3 numeric text-xs text-muted-foreground">
                  Created {q.createdAt} · {q.scans} scans
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => toast.success(`${q.name} downloaded as PNG.`)}>
                    <Download className="mr-1 h-3.5 w-3.5" /> Download
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => toast.success("Print sheet prepared.")}>
                    <Printer className="mr-1 h-3.5 w-3.5" /> Print
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => toast.success("New code generated. The old one stops working.")}>
                    <RefreshCw className="mr-1 h-3.5 w-3.5" /> Regenerate
                  </Button>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                  <label className="flex items-center gap-2 text-xs">
                    <Switch checked={q.active} onCheckedChange={(v) => updateQr(q.id, { active: v })} aria-label={`${q.name} active`} />
                    Enabled for visitors
                  </label>
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:text-destructive"
                    onClick={() => {
                      removeQr(q.id);
                      toast.success(`${q.name} deleted.`);
                    }}
                  >
                    <Trash2 className="mr-1 inline h-3.5 w-3.5" /> Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Dialog open={!!previewQr} onOpenChange={(v) => !v && setPreview(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{previewQr?.name}</DialogTitle>
          </DialogHeader>
          {previewQr && (
            <div className="flex flex-col items-center gap-4 py-2">
              <QrGlyph value={previewQr.id} size={220} />
              <p className="text-center text-sm text-muted-foreground">{where(previewQr.buildingId, previewQr.floorId)}</p>
              <Button asChild variant="outline">
                <Link to="/v/$qrId" params={{ qrId: previewQr.id }}>
                  Open what visitors see
                </Link>
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
