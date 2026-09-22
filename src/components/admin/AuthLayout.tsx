import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
  wide = false,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="mx-auto flex w-full flex-1 items-center justify-center px-4 py-10">
        <div className={wide ? "w-full max-w-3xl" : "w-full max-w-md"}>
          <Link to="/" className="mb-7 flex items-center justify-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-secondary text-sm font-bold text-secondary-foreground">
              N
            </span>
            <span className="text-base font-semibold tracking-tight">NAVISENSE</span>
          </Link>
          <div className="rounded-xl border border-border bg-card p-6 shadow-1 sm:p-8">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">{title}</h1>
            {subtitle && <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>}
            <div className="mt-6">{children}</div>
          </div>
          {footer && <div className="mt-5 text-center text-sm text-muted-foreground">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
