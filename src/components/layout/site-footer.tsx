import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-bg-elevated">
      <div className="page-shell flex flex-col gap-4 py-8 text-sm text-fg-muted sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-md space-y-2">
          <p className="font-display text-base font-semibold text-fg">Pulse</p>
          <p>
            Two-way alignment signals between people and the leaders who serve
            them. Hosting a petition is not endorsement.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          <Link to="/petitions" className="text-fg-muted no-underline hover:text-fg">
            Browse signals
          </Link>
          <Link to="/create" className="text-fg-muted no-underline hover:text-fg">
            Start a signal
          </Link>
          <Link to="/leaders" className="text-fg-muted no-underline hover:text-fg">
            Leader inbox
          </Link>
          <Link to="/about" className="text-fg-muted no-underline hover:text-fg">
            About
          </Link>
        </div>
      </div>
    </footer>
  );
}
