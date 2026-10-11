import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AlertCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import { AuthLayout } from "@/components/admin/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { registerAdmin } from "@/lib/api";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Register your organization — NAVISENSE" },
      { name: "description", content: "Request a NAVISENSE workspace for your campus, hospital or office and set up your administrator account." },
      { property: "og:title", content: "Register your organization — NAVISENSE" },
      { property: "og:description", content: "Request a NAVISENSE workspace for your facility." },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Organization fields
  const [orgName, setOrgName] = useState("");
  const [orgType, setOrgType] = useState("education");
  const [website, setWebsite] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  // Admin fields
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  if (submitted) {
    return (
      <AuthLayout title="Registration successful" subtitle="Your organization and admin account have been created.">
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-sm text-muted-foreground">
            You can now log in to access your NAVISENSE admin dashboard.
          </p>
          <Button asChild className="w-full">
            <Link to="/login">Go to login</Link>
          </Button>
        </div>
      </AuthLayout>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!orgName || !adminName || !adminEmail || !adminPassword) {
      setError("Please fill in all required fields.");
      return;
    }

    if (adminPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setBusy(true);
    try {
      const result = await registerAdmin(adminEmail, adminPassword, adminName, orgName);

      if (result.error) {
        setError(result.error);
        setBusy(false);
        return;
      }

      if (result.token) {
        setTimeout(() => {
          setSubmitted(true);
          setTimeout(() => navigate({ to: "/admin" }), 2000);
        }, 800);
      }
    } catch (err) {
      setError("An error occurred during registration. Please try again.");
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      wide
      title="Register your organization"
      subtitle="Two things to set up: the organization itself, and your administrator account."
      footer={
        <>
          Already have access?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form className="space-y-8" onSubmit={submit}>
        {error && (
          <div role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive-soft px-3 py-2.5 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>{error}</span>
          </div>
        )}

        <section className="space-y-4">
          <h2 className="border-b border-border pb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            About your organization
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="org">Organization name *</Label>
              <Input
                id="org"
                required
                placeholder="North Valley Institute"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Organization type</Label>
              <Select defaultValue={orgType} onValueChange={setOrgType}>
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="education">Education / campus</SelectItem>
                  <SelectItem value="hospital">Hospital / healthcare</SelectItem>
                  <SelectItem value="office">Corporate office</SelectItem>
                  <SelectItem value="public">Public building</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="web">Website</Label>
              <Input
                id="web"
                placeholder="northvalley.edu"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="addr">Address</Label>
              <Input
                id="addr"
                placeholder="12 Ridge Road, North Valley"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">What do you want to map first?</Label>
            <Textarea
              id="notes"
              rows={3}
              placeholder="e.g. Engineering Block — 4 floors, roughly 60 rooms."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="border-b border-border pb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Administrator account
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full name *</Label>
              <Input
                id="name"
                required
                placeholder="Pranitee Sonavane"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mail">Work email *</Label>
              <Input
                id="mail"
                type="email"
                required
                placeholder="admin@northvalley.edu"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="pw">Password *</Label>
              <Input
                id="pw"
                type="password"
                required
                autoComplete="new-password"
                placeholder="Minimum 6 characters"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
              />
            </div>
          </div>
        </section>

        <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={busy}>
          {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {busy ? "Creating account..." : "Create organization"}
        </Button>
      </form>
    </AuthLayout>
  );
}
