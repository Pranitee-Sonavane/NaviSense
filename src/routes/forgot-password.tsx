import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useState } from "react";
import { AuthLayout } from "@/components/admin/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset your password — NAVISENSE" },
      { name: "description", content: "Request a password reset link for your NAVISENSE administrator account." },
      { property: "og:title", content: "Reset your password — NAVISENSE" },
      { property: "og:description", content: "Request a password reset link for the NAVISENSE admin portal." },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <AuthLayout title="Check your inbox" subtitle={`If an account exists for ${email}, a reset link is on its way.`}>
        <div className="flex flex-col items-center gap-4 text-center">
          <CheckCircle2 className="h-10 w-10 text-success" aria-hidden />
          <p className="text-sm text-muted-foreground">The link expires in 30 minutes.</p>
          <Button asChild variant="outline" className="w-full">
            <Link to="/reset-password">Open reset link (demo)</Link>
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
      title="Forgot your password?"
      subtitle="Enter your work email and we'll send you a reset link."
      footer={
        <Link to="/login" className="font-medium text-primary hover:underline">
          Back to log in
        </Link>
      }
    >
      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          setBusy(true);
          setTimeout(() => {
            setBusy(false);
            setSent(true);
          }, 700);
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="email">Work email</Label>
          <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@organization.edu" />
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={busy}>
          {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Send reset link
        </Button>
      </form>
    </AuthLayout>
  );
}
