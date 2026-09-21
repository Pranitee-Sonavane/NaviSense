import { Link, useRouterState } from "@tanstack/react-router";
import {
  Building2,
  LayoutDashboard,
  LogOut,
  Menu,
  QrCode,
  Settings,
  ShieldCheck,
  Smartphone,
  X,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useOrg } from "@/lib/navisense/store";

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/buildings", label: "Buildings", icon: Building2 },
  { to: "/admin/qr", label: "QR Codes", icon: QrCode },
  { to: "/admin/validation", label: "Validation", icon: ShieldCheck },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const org = useOrg();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const rail = (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-sidebar-primary text-sm font-bold text-sidebar-primary-foreground">
          N
        </span>
        <span className="text-[15px] font-semibold tracking-tight text-white">NAVISENSE</span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2" aria-label="Admin sections">
        {NAV.map((item) => {
          const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
              aria-current={active ? "page" : undefined}
            >
              <item.icon className="h-[18px] w-[18px]" aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-3 border-t border-sidebar-border p-3">
        <Link
          to="/v"
          className="flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <Smartphone className="h-4 w-4" aria-hidden />
          Open visitor experience
        </Link>
        <div className="rounded-md bg-sidebar-accent px-3 py-2.5">
          <p className="text-[11px] uppercase tracking-wide text-sidebar-foreground/70">Organization</p>
          <p className="truncate text-sm font-medium text-white">{org.name}</p>
        </div>
        <div className="flex items-center justify-between gap-2 px-1">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-xs font-semibold text-sidebar-primary-foreground">
              PS
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-white">P. Sonavane</p>
              <p className="truncate text-[11px] text-sidebar-foreground/70">Administrator</p>
            </div>
          </div>
          <Link to="/login" aria-label="Log out" className="rounded p-1.5 text-sidebar-foreground/80 hover:bg-sidebar-accent">
            <LogOut className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 lg:block">{rail}</aside>

      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-card px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">N</span>
          <span className="text-sm font-semibold">NAVISENSE</span>
        </div>
        <Button variant="ghost" size="icon" aria-label="Open navigation" onClick={() => setOpen(true)}>
          <Menu className="h-5 w-5" />
        </Button>
      </header>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button aria-label="Close navigation" className="absolute inset-0 bg-secondary/60" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-64 shadow-2">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Close navigation"
              className="absolute right-2 top-3 z-10 text-white hover:bg-sidebar-accent"
              onClick={() => setOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
            {rail}
          </div>
        </div>
      )}

      <main className="lg:pl-60">
        <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
      </main>
    </div>
  );
}
