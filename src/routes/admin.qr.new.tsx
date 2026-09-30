import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Crumbs, PageHeader, QrGlyph } from "@/components/shared/ui-bits";
import { useBuildings, useNavi, useOrg } from "@/lib/navisense/store";

export const Route = createFileRoute("/admin/qr/new")({
  head: () => ({
    meta: [
      { title: "Generate QR — NAVISENSE admin" },
      { name: "description", content: "Create a QR code for a specific building, floor and entry point." },
      { property: "og:title", content: "Generate QR — NAVISENSE admin" },
      { property: "og:description", content: "Create a new QR entry point." },
    ],
  }),
  component: GenerateQr,
});

function GenerateQr() {
  const org = useOrg();
  const buildings = useBuildings();
  const { data, addQr } = useNavi();
  const navigate = useNavigate();

  const [buildingId, setBuildingId] = useState(buildings[0]?.id ?? "");
  const floors = data.floors.filter((f) => f.buildingId === buildingId).sort((a, b) => a.level - b.level);
  const [floorId, setFloorId] = useState(floors[0]?.id ?? "");
  const entryNodes = data.nodes.filter((n) => n.floorId === floorId);
  const [entryNodeId, setEntryNodeId] = useState(entryNodes[0]?.id ?? "");
  const [name, setName] = useState("");

  const previewValue = `${org.id}|${buildingId}|${floorId}|${entryNodeId}`;

  return (
    <>
      <Crumbs items={[{ label: "QR codes", to: "/admin/qr" }, { label: "Generate" }]} />
      <PageHeader title="Generate QR code" description="A code always resolves to one entry point, so visitors start from a known spot." />

      <div className="mt-6 grid max-w-4xl gap-6 lg:grid-cols-[1fr_280px]">
        <form
          className="space-y-5 rounded-xl border border-border bg-card p-6 shadow-1"
          onSubmit={(e) => {
            e.preventDefault();
            const created = addQr({ orgId: org.id, buildingId, floorId, entryNodeId, name: name || "Untitled entry point", active: true });
            toast.success(`${created.name} generated.`);
            navigate({ to: "/admin/qr" });
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="q-building">Building</Label>
            <Select
              value={buildingId}
              onValueChange={(v) => {
                setBuildingId(v);
                const first = data.floors.filter((f) => f.buildingId === v).sort((a, b) => a.level - b.level)[0];
                setFloorId(first?.id ?? "");
                setEntryNodeId(data.nodes.find((n) => n.floorId === first?.id)?.id ?? "");
              }}
            >
              <SelectTrigger id="q-building">
                <SelectValue placeholder="Choose a building" />
              </SelectTrigger>
              <SelectContent>
                {buildings.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="q-floor">Floor</Label>
            <Select
              value={floorId}
              onValueChange={(v) => {
                setFloorId(v);
                setEntryNodeId(data.nodes.find((n) => n.floorId === v)?.id ?? "");
              }}
            >
              <SelectTrigger id="q-floor">
                <SelectValue placeholder="Choose a floor" />
              </SelectTrigger>
              <SelectContent>
                {floors.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="q-entry">Entry point</Label>
            <Select value={entryNodeId} onValueChange={setEntryNodeId}>
              <SelectTrigger id="q-entry">
                <SelectValue placeholder="Choose where this code is placed" />
              </SelectTrigger>
              <SelectContent>
                {entryNodes.map((n) => (
                  <SelectItem key={n.id} value={n.id}>
                    {n.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">This is where the visitor is standing when they scan.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="q-name">Label</Label>
            <Input id="q-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Main entrance — left pillar" required />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={!buildingId || !floorId || !entryNodeId}>
              Generate code
            </Button>
            <Button type="button" variant="ghost" asChild>
              <Link to="/admin/qr">Cancel</Link>
            </Button>
          </div>
        </form>

        <div className="flex h-fit flex-col items-center gap-3 rounded-xl border border-border bg-card p-6 shadow-1">
          <p className="text-sm font-medium">Preview</p>
          <QrGlyph value={previewValue} size={180} />
          <p className="text-center text-xs text-muted-foreground">{name || "Your label appears under the code when printed."}</p>
        </div>
      </div>
    </>
  );
}
