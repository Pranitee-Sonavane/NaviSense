import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock3, Loader2 } from "lucide-react";
import { useState } from "react";
import { AuthLayout } from "@/components/admin/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

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
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <AuthLayout title="Request received" subtitle="We're reviewing your organization details.">
        <div className="flex flex-col items-center gap-4 text-center">
          <Clock3 className="h-10 w-10 text-info" aria-hidden />
          <p className="text-sm text-muted-foreground">
            Most reviews complete within one business day. You'll get an email as soon as your workspace is ready.
          </p>
          <Button asChild className="w-full">
            <Link to="/setup">Continue to setup (demo)</Link>
          </Button>
          <Button asChild variant="ghost" className="w-full">
            <Link to="/login">Back to log in</Link>
          </Button>
        </div>
      </AuthLayout>
    );
  }

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
      <form
        className="space-y-8"
        onSubmit={(e) => {
          e.preventDefault();
          setBusy(true);
          setTimeout(() => setSubmitted(true), 800);
        }}
      >
        <section className="space-y-4">
          <h2 className="border-b border-border pb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            About your organization
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="org">Organization name</Label>
              <Input id="org" required placeholder="North Valley Institute" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Organization type</Label>
              <Select defaultValue="education">
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
              <Input id="web" placeholder="northvalley.edu" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="addr">Address</Label>
              <Input id="addr" placeholder="12 Ridge Road, North Valley" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">What do you want to map first?</Label>
            <Textarea id="notes" rows={3} placeholder="e.g. Engineering Block — 4 floors, roughly 60 rooms." />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="border-b border-border pb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Administrator account
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" required placeholder="Pranitee Sonavane" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mail">Work email</Label>
              <Input id="mail" type="email" required placeholder="admin@northvalley.edu" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="pw">Password</Label>
              <Input id="pw" type="password" required autoComplete="new-password" />
            </div>
          </div>
        </section>

        <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={busy}>
          {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Request setup
        </Button>
      </form>
    </AuthLayout>
  );
}
