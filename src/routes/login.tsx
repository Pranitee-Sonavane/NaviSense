import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AlertCircle, Loader2 } from "lucide-react";
import { useState } from "react";
import { AuthLayout } from "@/components/admin/AuthLayout";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAdmin } from "@/lib/api";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Admin log in — NAVISENSE" },
      { name: "description", content: "Log in to the NAVISENSE admin portal to configure buildings, indoor maps and QR entry points." },
      { property: "og:title", content: "Admin log in — NAVISENSE" },
      { property: "og:description", content: "Access the NAVISENSE facility administrator portal." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@navisense.com");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!email.includes("@") || password.length < 4) {
      setError("That email and password combination doesn't look right. Check and try again.");
      return;
    }
    
    setBusy(true);
    try {
      const result = await loginAdmin(email, password);
      
      if (result.error) {
        setError(result.error);
        setBusy(false);
        return;
      }
      
      if (result.token) {
        setTimeout(() => navigate({ to: "/admin" }), 700);
      }
    } catch (err) {
      setError("An error occurred during login. Please try again.");
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      title="Log in to NAVISENSE"
      subtitle="Facility administrator portal"
      footer={
        <>
          New organization?{" "}
          <Link to="/register" className="font-medium text-primary hover:underline">
            Request access
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-5" noValidate>
        {error && (
          <div role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive-soft px-3 py-2.5 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">Work email</Label>
          <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link to="/forgot-password" className="text-sm font-medium text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <Input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>

        <div className="flex items-center gap-2">
          <Checkbox id="remember" defaultChecked />
          <Label htmlFor="remember" className="text-sm font-normal text-muted-foreground">
            Keep me logged in on this device
          </Label>
        </div>

        <Button type="submit" className="w-full" size="lg" disabled={busy}>
          {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {busy ? "Signing in…" : "Log in"}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          Connected to live backend · Database: Neon PostgreSQL
        </p>
      </form>
    </AuthLayout>
  );
}
