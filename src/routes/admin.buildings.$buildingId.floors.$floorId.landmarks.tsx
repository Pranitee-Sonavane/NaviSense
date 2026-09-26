import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Flag, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Crumbs, EmptyState, PageHeader } from "@/components/shared/ui-bits";
import { useBuilding, useFloor, useFloorContent, useNavi } from "@/lib/navisense/store";
import { LANDMARK_LABEL, type Landmark, type LandmarkType } from "@/lib/navisense/types";

export const Route = createFileRoute("/admin/buildings/$buildingId/floors/$floorId/landmarks")({
  head: () => ({
    meta: [
      { title: "Landmarks — NAVISENSE admin" },
      { name: "description", content: "Add, edit and remove the landmarks visitors navigate by: entrances, reception, stairs, elevators, restrooms and more." },
      { property: "og:title", content: "Landmarks — NAVISENSE admin" },
      { property: "og:description", content: "Manage this floor's landmarks." },
    ],
  }),
  component: Landmarks,
});

function Landmarks() {
  const { buildingId, floorId } = Route.useParams();
  const building = useBuilding(buildingId);
  const floor = useFloor(floorId);
  const { landmarks } = useFloorContent(floorId);
  const { upsertLandmark, removeLandmark } = useNavi();
  const [editing, setEditing] = useState<Landmark | null>(null);
  const [open, setOpen] = useState(false);

  const blank = (): Landmark => ({
    id: `lm-${Math.random().toString(36).slice(2, 8)}`,
    floorId,
    type: "reception",
    name: "",
    description: "",
    position: { x: 500, y: 325 },
    navNodeId: null,
  });

  return (
    <>
      <Crumbs
        items={[
          { label: "Buildings", to: "/admin/buildings" },
          { label: building?.name ?? "Building", to: "/admin/buildings/$buildingId", params: { buildingId } },
          { label: floor?.name ?? "Floor", to: "/admin/buildings/$buildingId/floors/$floorId", params: { buildingId, floorId } },
          { label: "Landmarks" },
        ]}
      />
      <PageHeader
        title="Landmarks"
        description="Landmarks are the things people actually look for while walking — entrances, reception, stairs, elevators, restrooms."
        actions={
          <Dialog
            open={open}
            onOpenChange={(v) => {
              setOpen(v);
              if (!v) setEditing(null);
            }}
          >
            <DialogTrigger asChild>
              <Button onClick={() => setEditing(blank())}>
                <Plus className="mr-1 h-4 w-4" /> Add landmark
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editing && landmarks.some((l) => l.id === editing.id) ? "Edit landmark" : "Add landmark"}</DialogTitle>
              </DialogHeader>
              {editing && (
                <form
                  className="space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    upsertLandmark(editing);
                    setOpen(false);
                    setEditing(null);
                    toast.success("Landmark saved.");
                  }}
                >
                  <div className="space-y-2">
                    <Label htmlFor="lm-type">Type</Label>
                    <Select value={editing.type} onValueChange={(v) => setEditing({ ...editing, type: v as LandmarkType })}>
                      <SelectTrigger id="lm-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(LANDMARK_LABEL).map(([k, v]) => (
                          <SelectItem key={k} value={k}>
                            {v}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lm-n">Name</Label>
                    <Input id="lm-n" value={editing.name} required onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lm-d">Description</Label>
                    <Textarea id="lm-d" rows={3} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="lm-x">Map X</Label>
                      <Input id="lm-x" type="number" value={editing.position.x} onChange={(e) => setEditing({ ...editing, position: { ...editing.position, x: Number(e.target.value) } })} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lm-y">Map Y</Label>
                      <Input id="lm-y" type="number" value={editing.position.y} onChange={(e) => setEditing({ ...editing, position: { ...editing.position, y: Number(e.target.value) } })} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">Save landmark</Button>
                  </DialogFooter>
                </form>
              )}
            </DialogContent>
          </Dialog>
        }
      />

      <div className="mt-6">
        {landmarks.length === 0 ? (
          <EmptyState icon={Flag} title="No landmarks on this floor" body="Add at least an entrance and a staircase or elevator so visitors can move between floors." />
        ) : (
          <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {landmarks.map((lm) => (
              <li key={lm.id} className="rounded-xl border border-border bg-card p-5 shadow-1">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{LANDMARK_LABEL[lm.type]}</p>
                <p className="mt-1 text-sm font-semibold">{lm.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{lm.description || "No description"}</p>
                <div className="mt-4 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditing(lm);
                      setOpen(true);
                    }}
                  >
                    <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => {
                      removeLandmark(lm.id);
                      toast.success(`${lm.name} removed.`);
                    }}
                  >
                    <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
