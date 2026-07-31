import { Link, useRouterState } from "@tanstack/react-router";
import { Activity, Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/petitions", label: "Signals" },
  { to: "/create", label: "Start a signal" },
  { to: "/leaders", label: "For leaders" },
  { to: "/account", label: "Account" },
  { to: "/me", label: "My pulse" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-bg/90 backdrop-blur-md">
      <div className="page-shell flex h-14 items-center justify-between gap-3 sm:h-16">
        <Link to="/" className="flex items-center gap-2 text-fg no-underline">
          <span className="grid h-9 w-9 place-items-center rounded-[var(--radius-md)] bg-primary text-primary-fg">
            <Activity className="h-4 w-4" strokeWidth={2.25} />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">
            Pulse
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "rounded-[var(--radius-sm)] px-3 py-2 text-sm font-medium no-underline transition-colors",
                pathname === item.to || pathname.startsWith(item.to + "/")
                  ? "bg-primary-soft text-primary"
                  : "text-fg-muted hover:bg-bg-subtle hover:text-fg",
              )}
            >
              {item.label}
            </Link>
          ))}
          <Link
            to="/create"
            className="ml-2 inline-flex h-9 items-center rounded-[var(--radius-sm)] bg-primary px-3 text-xs font-medium text-primary-fg no-underline hover:bg-primary/90"
          >
            New signal
          </Link>
        </nav>

        <button
          type="button"
          className="grid h-11 w-11 place-items-center rounded-[var(--radius-md)] border border-border bg-bg-elevated md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border bg-bg-elevated md:hidden">
          <nav className="page-shell flex flex-col gap-1 py-3">
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="rounded-[var(--radius-md)] px-3 py-3 text-sm font-medium text-fg no-underline hover:bg-bg-subtle"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
