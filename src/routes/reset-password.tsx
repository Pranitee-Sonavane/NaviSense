import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AuthLayout } from "@/components/admin/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Choose a new password — NAVISENSE" },
      { name: "description", content: "Set a new password for your NAVISENSE administrator account." },
      { property: "og:title", content: "Choose a new password — NAVISENSE" },
      { property: "og:description", content: "Set a new password for the NAVISENSE admin portal." },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <AuthLayout title="Choose a new password" subtitle="Use at least 8 characters, including a number.">
      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (pw.length < 8) return setError("Password must be at least 8 characters.");
          if (pw !== confirm) return setError("Those passwords don't match.");
          setError(null);
          setBusy(true);
          setTimeout(() => {
            toast.success("Password updated. You can log in now.");
            navigate({ to: "/login" });
          }, 700);
        }}
      >
        {error && (
          <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive-soft px-3 py-2.5 text-sm text-destructive">
            {error}
          </p>
        )}
        <div className="space-y-2">
          <Label htmlFor="pw">New password</Label>
          <Input id="pw" type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">Confirm new password</Label>
          <Input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={busy}>
          {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Update password
        </Button>
      </form>
    </AuthLayout>
  );
}
