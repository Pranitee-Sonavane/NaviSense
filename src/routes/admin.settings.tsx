import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader, StatusPill } from "@/components/shared/ui-bits";
import { useOrg } from "@/lib/navisense/store";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({
    meta: [
      { title: "Settings — NAVISENSE admin" },
      { name: "description", content: "Organization profile, your account, team members, security and general preferences." },
      { property: "og:title", content: "Settings — NAVISENSE admin" },
      { property: "og:description", content: "Manage organization, team and security settings." },
    ],
  }),
  component: SettingsPage,
});

const TEAM = [
  { name: "P. Sonavane", email: "admin@northvalley.edu", role: "Administrator", status: "Active" },
  { name: "R. Mehta", email: "r.mehta@northvalley.edu", role: "Editor", status: "Active" },
  { name: "A. Khan", email: "a.khan@northvalley.edu", role: "Viewer", status: "Invited" },
];

function SettingsPage() {
  const org = useOrg();
  const save = (what: string) => (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(`${what} saved.`);
  };

  return (
    <>
      <PageHeader title="Settings" description="Organization details, people and preferences for NAVISENSE." />

      <Tabs defaultValue="organization" className="mt-6">
        <TabsList>
          <TabsTrigger value="organization">Organization</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="general">General</TabsTrigger>
        </TabsList>

        <TabsContent value="organization" className="mt-5">
          <form className="max-w-xl space-y-5 rounded-xl border border-border bg-card p-6 shadow-1" onSubmit={save("Organization details")}>
            <div className="space-y-2">
              <Label htmlFor="o-name">Organization name</Label>
              <Input id="o-name" defaultValue={org.name} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="o-type">Type</Label>
                <Input id="o-type" defaultValue={org.type} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="o-web">Website</Label>
                <Input id="o-web" defaultValue={org.website} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="o-addr">Address</Label>
              <Textarea id="o-addr" rows={3} defaultValue={org.address} />
            </div>
            <Button type="submit">Save changes</Button>
          </form>
        </TabsContent>

        <TabsContent value="profile" className="mt-5">
          <form className="max-w-xl space-y-5 rounded-xl border border-border bg-card p-6 shadow-1" onSubmit={save("Profile")}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="p-first">First name</Label>
                <Input id="p-first" defaultValue="Pranav" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-last">Last name</Label>
                <Input id="p-last" defaultValue="Sonavane" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-email">Email</Label>
              <Input id="p-email" type="email" defaultValue="admin@northvalley.edu" />
            </div>
            <Button type="submit">Save profile</Button>
          </form>
        </TabsContent>

        <TabsContent value="team" className="mt-5">
          <div className="max-w-3xl overflow-hidden rounded-xl border border-border bg-card shadow-1">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {TEAM.map((m) => (
                  <tr key={m.email} className="border-t border-border">
                    <td className="px-5 py-3">
                      <p className="font-medium">{m.name}</p>
                      <p className="text-xs text-muted-foreground">{m.email}</p>
                    </td>
                    <td className="px-5 py-3">{m.role}</td>
                    <td className="px-5 py-3">
                      <StatusPill tone={m.status === "Active" ? "success" : "info"}>{m.status}</StatusPill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Button className="mt-4" onClick={() => toast.success("Invitation sent.")}>
            Invite team member
          </Button>
        </TabsContent>

        <TabsContent value="security" className="mt-5">
          <form className="max-w-xl space-y-5 rounded-xl border border-border bg-card p-6 shadow-1" onSubmit={save("Security settings")}>
            <div className="space-y-2">
              <Label htmlFor="s-current">Current password</Label>
              <Input id="s-current" type="password" placeholder="••••••••" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="s-new">New password</Label>
              <Input id="s-new" type="password" placeholder="At least 8 characters" />
            </div>
            <ToggleRow label="Two-step verification" hint="Ask for a code when signing in from a new device." />
            <ToggleRow label="Sign out inactive sessions" hint="Automatically end sessions after 30 minutes." />
            <Button type="submit">Update security</Button>
          </form>
        </TabsContent>

        <TabsContent value="general" className="mt-5">
          <div className="max-w-xl space-y-4 rounded-xl border border-border bg-card p-6 shadow-1">
            <ToggleRow label="Show distances in metres" hint="Switch off to use feet." defaultOn />
            <ToggleRow label="Prefer step-free routes by default" hint="Visitors can still change this." />
            <ToggleRow label="Email me weekly activity summaries" hint="A short digest of scans and edits." defaultOn />
            <div className="rounded-lg border border-dashed border-border px-4 py-3 text-xs text-muted-foreground">
              Coming later: visitor analytics, advanced accessibility routing and voice guidance.
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}

function ToggleRow({ label, hint, defaultOn = false }: { label: string; hint: string; defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-border px-4 py-3">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <Switch checked={on} onCheckedChange={setOn} aria-label={label} />
    </div>
  );
}
