import { useEffect, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getOwnerDashboard,
  type OwnerDashboard,
  type PulseCounts,
} from "@/lib/pulse/admin-stats";
import { usePulseStore } from "@/lib/pulse/store";
import type { PulsePerson } from "@/lib/pulse/types";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

const ENGINE_APP = "https://appengine.unitedundergod.org/apps/pulse";
const ENGINE_HELP = "https://appengine.unitedundergod.org/help?app=pulse";

function formatCount(value: number | null): string {
  if (value === null) return "—";
  return String(value);
}

function CountTile({
  label,
  value,
  note,
}: {
  label: string;
  value: number | null;
  note: string;
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-border bg-bg px-4 py-4">
      <p className="text-xs font-medium uppercase tracking-wide text-fg-subtle">
        {label}
      </p>
      <p className="mt-1 font-display text-3xl font-semibold tabular-nums text-fg">
        {formatCount(value)}
      </p>
      <p className="mt-1 text-xs text-fg-muted">{note}</p>
    </div>
  );
}

function CountGrid({ counts }: { counts: PulseCounts }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <CountTile
        label="Leaders"
        value={counts.leaders}
        note={
          counts.leaders === null
            ? "pulse_leaders is not reachable"
            : "Seats in the live table"
        }
      />
      <CountTile
        label="Petitions"
        value={counts.petitions}
        note={
          counts.petitions === null
            ? "pulse_petitions is not reachable"
            : "Signals in the live table"
        }
      />
      <CountTile
        label="Signatures"
        value={counts.signatures}
        note={
          counts.signatures === null
            ? "pulse_signatures is not reachable"
            : "Real support rows"
        }
      />
      <CountTile
        label="Responses"
        value={counts.responses}
        note={
          counts.responses === null
            ? "pulse_responses is not reachable"
            : "Leader replies"
        }
      />
      <CountTile
        label="People"
        value={counts.people}
        note={
          counts.people === null
            ? "pulse_people is not reachable"
            : "Accounts that actually exist"
        }
      />
      <CountTile
        label="Notices"
        value={counts.notices}
        note={
          counts.notices === null
            ? "pulse_notices is not reachable"
            : "Recorded leader notices"
        }
      />
    </div>
  );
}

function AdminPage() {
  const person = usePulseStore((s) => s.person);
  const setPerson = usePulseStore((s) => s.setPerson);
  const [dash, setDash] = useState<OwnerDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      const next = await getOwnerDashboard();
      setDash(next);
    } catch {
      setDash({ status: "signed_out" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, [person?.id]);

  async function onSignIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", email, password }),
      });
      const data = (await res.json()) as {
        ok: boolean;
        error?: string;
        person?: PulsePerson;
      };
      if (!res.ok || !data.ok || !data.person) {
        toast.error(data.error || "Could not sign in");
        return;
      }
      setPerson(data.person);
      toast.success("Signed in");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page-shell max-w-2xl space-y-6 py-10 sm:py-14">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Owner door
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">
          Pulse admin
        </h1>
        <p className="mt-2 text-sm text-fg-muted">
          Separate from the{" "}
          <Link to="/leaders" className="font-medium text-accent">
            leader inbox
          </Link>
          . These are live table counts for the owner — a dash means the table
          is missing or unreachable, a zero means it exists and is empty.
        </p>
      </div>

      {loading || !dash ? (
        <div className="h-40 animate-pulse rounded-[var(--radius-xl)] bg-bg-subtle" />
      ) : dash.status === "signed_out" ? (
        <form onSubmit={onSignIn} className="surface-card space-y-4 p-5">
          <div>
            <h2 className="font-display text-lg font-semibold">
              Sign in as the owner
            </h2>
            <p className="mt-1 text-sm text-fg-muted">
              Use your real Pulse account. This is not a test login.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="owner-email">Email</Label>
            <Input
              id="owner-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="owner-password">Password</Label>
            <Input
              id="owner-password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={busy}>
              {busy ? "Signing in…" : "Sign in"}
            </Button>
            <Link
              to="/account"
              className="inline-flex h-11 items-center px-3 text-sm text-fg-muted no-underline hover:text-fg"
            >
              Open account page
            </Link>
          </div>
        </form>
      ) : dash.status === "forbidden" ? (
        <div className="surface-card space-y-3 p-5">
          <h2 className="font-display text-lg font-semibold">
            Not the owner door
          </h2>
          <p className="text-sm text-fg-muted">
            Signed in as {dash.email ?? "this account"}. Only the Pulse owner
            can see these counts. The{" "}
            <Link to="/leaders" className="font-medium text-accent">
              leader inbox
            </Link>{" "}
            is still the place for seat replies.
          </p>
        </div>
      ) : (
        <div className="surface-card space-y-4 p-5">
          <div>
            <h2 className="font-display text-lg font-semibold">
              Live schema counts
            </h2>
            <p className="mt-1 text-sm text-fg-muted">
              Signed in as {dash.email}.
            </p>
          </div>
          <CountGrid counts={dash.counts} />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-4 text-sm text-fg-muted">
        <a href={ENGINE_APP} className="hover:text-fg">
          App Engine dossier
        </a>
        <a href={ENGINE_HELP} className="hover:text-fg">
          Need help?
        </a>
        <Link to="/" className="hover:text-fg">
          Back home
        </Link>
      </div>
    </div>
  );
}
