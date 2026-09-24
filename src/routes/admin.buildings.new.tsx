import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Crumbs, PageHeader } from "@/components/shared/ui-bits";
import { useNavi } from "@/lib/navisense/store";

export const Route = createFileRoute("/admin/buildings/new")({
  head: () => ({
    meta: [
      { title: "Add building — NAVISENSE admin" },
      { name: "description", content: "Create a building and its floors, then upload floor plans to make it navigable." },
      { property: "og:title", content: "Add building — NAVISENSE admin" },
      { property: "og:description", content: "Create a building in your NAVISENSE organization." },
    ],
  }),
  component: AddBuilding,
});

function AddBuilding() {
  const { addBuilding } = useNavi();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [type, setType] = useState("Academic");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [floorCount, setFloorCount] = useState(3);

  return (
    <>
      <Crumbs items={[{ label: "Dashboard", to: "/admin" }, { label: "Buildings", to: "/admin/buildings" }, { label: "Add building" }]} />
      <PageHeader title="Add building" description="Name it, set how many floors it has, and we'll create the floor structure for you." />

      <form
        className="mt-6 max-w-2xl space-y-6 rounded-xl border border-border bg-card p-6 shadow-1"
        onSubmit={(e) => {
          e.preventDefault();
          const b = addBuilding({ name, type, address, description, floorCount });
          toast.success(`${b.name} created with ${floorCount} floors.`);
          navigate({ to: "/admin/buildings/$buildingId", params: { buildingId: b.id } });
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="name">Building name</Label>
          <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Science Block" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger id="type"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["Academic", "Administrative", "Hostel", "Hospital wing", "Office", "Other"].map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="floors">Number of floors (including ground)</Label>
            <Input
              id="floors"
              type="number"
              min={1}
              max={30}
              value={floorCount}
              onChange={(e) => setFloorCount(Math.max(1, Number(e.target.value)))}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, area" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="desc">Description</Label>
          <Textarea id="desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What's inside this building?" />
        </div>

        <div className="flex gap-2">
          <Button type="submit">Create building</Button>
          <Button type="button" variant="ghost" onClick={() => navigate({ to: "/admin/buildings" })}>
            Cancel
          </Button>
        </div>
      </form>
    </>
  );
}
