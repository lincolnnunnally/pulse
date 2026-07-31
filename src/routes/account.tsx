import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePulseStore } from "@/lib/pulse/store";
import type { PulsePerson } from "@/lib/pulse/types";
import { LEVEL_LABELS, verificationBadge } from "@/lib/pulse/verify";

export const Route = createFileRoute("/account")({
  component: AccountPage,
});

function AccountPage() {
  const person = usePulseStore((s) => s.person);
  const setPerson = usePulseStore((s) => s.setPerson);

  if (person) {
    return <ProfilePanel person={person} onPerson={setPerson} />;
  }
  return <AuthPanel onPerson={setPerson} />;
}

function AuthPanel({
  onPerson,
}: {
  onPerson: (p: PulsePerson | null) => void;
}) {
  const [mode, setMode] = useState<"login" | "register">("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("GA");
  const [zip, setZip] = useState("");
  const [street, setStreet] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const body =
        mode === "register"
          ? {
              action: "register",
              email,
              password,
              name,
              city,
              state,
              zip,
              street,
            }
          : { action: "login", email, password };
      const res = await fetch("/api/auth", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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
      onPerson(data.person);
      toast.success(mode === "register" ? "Account created" : "Signed in");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page-shell max-w-lg py-10 sm:py-14">
      <h1 className="font-display text-3xl font-semibold tracking-tight">
        Your Pulse account
      </h1>
      <p className="mt-2 text-sm text-fg-muted">
        Free for people. Add place and address so leaders can trust your support
        is real and local — without turning Pulse into a paywall.
      </p>

      <div className="mt-6 flex gap-2">
        <Button
          type="button"
          variant={mode === "register" ? "default" : "secondary"}
          onClick={() => setMode("register")}
        >
          Create account
        </Button>
        <Button
          type="button"
          variant={mode === "login" ? "default" : "secondary"}
          onClick={() => setMode("login")}
        >
          Sign in
        </Button>
      </div>

      <form onSubmit={onSubmit} className="surface-card mt-6 space-y-4 p-5">
        {mode === "register" && (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  autoComplete="address-level2"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  required
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  autoComplete="address-level1"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="zip">ZIP</Label>
                <Input
                  id="zip"
                  value={zip}
                  onChange={(e) => setZip(e.target.value)}
                  autoComplete="postal-code"
                  placeholder="30012"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="street">Street (for L3)</Label>
                <Input
                  id="street"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  autoComplete="street-address"
                  placeholder="Optional now"
                />
              </div>
            </div>
          </>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password (8+ characters)</Label>
          <Input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={
              mode === "register" ? "new-password" : "current-password"
            }
          />
        </div>
        <Button type="submit" className="w-full" disabled={busy}>
          {busy
            ? "Working…"
            : mode === "register"
              ? "Create free account"
              : "Sign in"}
        </Button>
        <p className="text-[11px] text-fg-subtle">
          Street address is never shown publicly. Leaders see verification
          strength (L1–L4), not your street.
        </p>
      </form>

      <p className="mt-6 text-sm text-fg-muted">
        Leading a body of people?{" "}
        <Link to="/leaders" className="font-medium text-accent">
          Claim a leader seat
        </Link>{" "}
        after you sign in.
      </p>
    </div>
  );
}

function ProfilePanel({
  person,
  onPerson,
}: {
  person: PulsePerson;
  onPerson: (p: PulsePerson | null) => void;
}) {
  const [name, setName] = useState(person.name);
  const [city, setCity] = useState(person.city);
  const [state, setState] = useState(person.state);
  const [zip, setZip] = useState(person.zip);
  const [street, setStreet] = useState(person.street);
  const [busy, setBusy] = useState(false);
  const badge = verificationBadge(
    person.verificationLevel,
    person.addressStatus,
  );

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, city, state, zip, street }),
      });
      const data = (await res.json()) as {
        ok: boolean;
        error?: string;
        person?: PulsePerson;
      };
      if (!res.ok || !data.ok || !data.person) {
        toast.error(data.error || "Could not save");
        return;
      }
      onPerson(data.person);
      toast.success("Profile updated — verification level refreshed");
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await fetch("/api/auth", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout" }),
    });
    onPerson(null);
    toast.message("Signed out");
  }

  return (
    <div className="page-shell max-w-lg py-10 sm:py-14">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            {person.name}
          </h1>
          <p className="mt-1 text-sm text-fg-muted">{person.email}</p>
        </div>
        <Badge variant={badge.tone === "strong" ? "success" : "muted"}>
          L{person.verificationLevel} · {badge.label}
        </Badge>
      </div>

      <div className="surface-card mt-6 space-y-2 p-4 text-sm text-fg-muted">
        <p>
          <span className="font-medium text-fg">Verification ladder:</span>{" "}
          {LEVEL_LABELS[person.verificationLevel]}
        </p>
        <p>
          Place confirmed: {person.placeConfirmed ? "yes" : "add city + ZIP"} ·
          Address: {person.addressStatus.replace("_", " ")}
        </p>
        {person.isLeader && (
          <p className="text-primary">
            Leader seat claimed
            {person.leaderId ? ` · ${person.leaderId}` : ""}
          </p>
        )}
      </div>

      <form onSubmit={save} className="surface-card mt-6 space-y-4 p-5">
        <div className="space-y-1.5">
          <Label htmlFor="pname">Name</Label>
          <Input
            id="pname"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="pcity">City</Label>
            <Input
              id="pcity"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pstate">State</Label>
            <Input
              id="pstate"
              value={state}
              onChange={(e) => setState(e.target.value)}
              required
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pzip">ZIP (L2 place)</Label>
          <Input id="pzip" value={zip} onChange={(e) => setZip(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pstreet">Street address (L3 — never public)</Label>
          <Input
            id="pstreet"
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            placeholder="Used only for constituent verification"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={busy}>
            Save verification profile
          </Button>
          <Button type="button" variant="secondary" onClick={logout}>
            Sign out
          </Button>
          <Link
            to="/leaders"
            className="inline-flex h-11 items-center rounded-[var(--radius-md)] px-5 text-sm font-medium text-fg-muted no-underline hover:bg-bg-subtle hover:text-fg"
          >
            Leader inbox
          </Link>
        </div>
      </form>
    </div>
  );
}
