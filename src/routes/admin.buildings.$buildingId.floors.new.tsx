import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Crumbs, PageHeader } from "@/components/shared/ui-bits";
import { useBuilding, useFloors, useNavi } from "@/lib/navisense/store";

export const Route = createFileRoute("/admin/buildings/$buildingId/floors/new")({
  head: () => ({
    meta: [
      { title: "Add floor — NAVISENSE admin" },
      { name: "description", content: "Add a floor to a building and upload its floor plan." },
      { property: "og:title", content: "Add floor — NAVISENSE admin" },
      { property: "og:description", content: "Add a new floor level to this building." },
    ],
  }),
  component: AddFloor,
});

function AddFloor() {
  const { buildingId } = Route.useParams();
  const building = useBuilding(buildingId);
  const floors = useFloors(buildingId);
  const { addFloor } = useNavi();
  const navigate = useNavigate();
  const nextLevel = floors.length ? Math.max(...floors.map((f) => f.level)) + 1 : 0;
  const [level, setLevel] = useState(nextLevel);
  const [name, setName] = useState(nextLevel === 0 ? "Ground Floor" : `Floor ${nextLevel}`);
  const [description, setDescription] = useState("");

  return (
    <>
      <Crumbs
        items={[
          { label: "Buildings", to: "/admin/buildings" },
          { label: building?.name ?? "Building", to: "/admin/buildings/$buildingId", params: { buildingId } },
          { label: "Add floor" },
        ]}
      />
      <PageHeader title="Add floor" description="Floors are ordered from the ground floor upward." />

      <form
        className="mt-6 max-w-xl space-y-6 rounded-xl border border-border bg-card p-6 shadow-1"
        onSubmit={(e) => {
          e.preventDefault();
          const f = addFloor({ buildingId, level, name, description });
          toast.success(`${f.name} added. Upload a floor plan next.`);
          navigate({ to: "/admin/buildings/$buildingId/floors/$floorId/upload", params: { buildingId, floorId: f.id } });
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="level">Floor number</Label>
            <Input id="level" type="number" value={level} onChange={(e) => setLevel(Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Display name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="desc">Description</Label>
          <Textarea id="desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What's on this floor?" />
        </div>
        <div className="flex gap-2">
          <Button type="submit">Add floor & upload plan</Button>
          <Button type="button" variant="ghost" onClick={() => navigate({ to: "/admin/buildings/$buildingId", params: { buildingId } })}>
            Cancel
          </Button>
        </div>
      </form>
    </>
  );
}
