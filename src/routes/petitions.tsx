import { createFileRoute, Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { HostingNotice } from "@/components/pulse/hosting-notice";
import { PetitionCard } from "@/components/pulse/petition-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePulseStore } from "@/lib/pulse/store";

export const Route = createFileRoute("/petitions")({
  component: PetitionsPage,
});

function PetitionsPage() {
  const petitions = usePulseStore((s) => s.petitions);
  const leaders = usePulseStore((s) => s.leaders);
  const signatures = usePulseStore((s) => s.signatures);
  const person = usePulseStore((s) => s.person);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | "open" | "responded">("all");
  const [category, setCategory] = useState("all");
  const [nearMe, setNearMe] = useState(false);
  const [l3Only, setL3Only] = useState(false);

  const categories = useMemo(() => {
    const set = new Set(petitions.map((p) => p.category).filter(Boolean));
    return ["all", ...Array.from(set).sort()];
  }, [petitions]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const myState = (person?.state || "").toUpperCase();
    const myCity = (person?.city || "").toLowerCase();

    return [...petitions]
      .filter((p) => {
        if (status === "open" && p.status === "closed") return false;
        if (status === "open" && p.status === "responded") return false;
        if (status === "responded" && p.status !== "responded") return false;
        if (category !== "all" && p.category !== category) return false;

        const leader = leaders.find((l) => l.id === p.leaderId);
        const hay = [
          p.title,
          p.summary,
          p.ask,
          p.category,
          p.localeLabel,
          p.whyThisSeat,
          leader?.name,
          leader?.jurisdiction,
          leader?.title,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (needle && !hay.includes(needle)) return false;

        if (nearMe && (myState || myCity)) {
          const place = `${p.localeLabel || ""} ${leader?.jurisdiction || ""}`.toLowerCase();
          const okState = myState ? place.includes(myState.toLowerCase()) : true;
          const okCity = myCity ? place.includes(myCity) : true;
          if (!okState && !okCity) {
            // still allow statewide/national
            if (
              !place.includes("georgia") &&
              !place.includes("united states") &&
              !place.includes("nation")
            ) {
              return false;
            }
          }
        }

        if (l3Only) {
          const n = signatures.filter(
            (s) => s.petitionId === p.id && (s.verificationLevel ?? 1) >= 3,
          ).length;
          if (n < 1) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (a.featured !== b.featured) return a.featured ? -1 : 1;
        return +new Date(b.createdAt) - +new Date(a.createdAt);
      });
  }, [
    petitions,
    leaders,
    signatures,
    q,
    status,
    category,
    nearMe,
    l3Only,
    person,
  ]);

  return (
    <div className="page-shell py-10 sm:py-14">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            Browse campaigns
          </h1>
          <p className="max-w-2xl text-sm text-fg-muted sm:text-base">
            Search wants, policies, and local asks. See who can act, fork for
            your area, and share with neighbors.
          </p>
        </div>
        <Link
          to="/create"
          className="inline-flex h-11 items-center rounded-[var(--radius-md)] bg-primary px-4 text-sm font-medium text-primary-fg no-underline"
        >
          Start a signal
        </Link>
      </div>
      <HostingNotice className="mb-6" />

      <div className="surface-card mb-6 space-y-4 p-4 sm:p-5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search title, ask, place, leader…"
            className="pl-10"
            aria-label="Search campaigns"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as "all" | "open" | "responded")
              }
              className="flex h-11 w-full rounded-[var(--radius-md)] border border-border bg-bg-elevated px-3 text-sm"
            >
              <option value="all">All</option>
              <option value="open">Open</option>
              <option value="responded">Leader responded</option>
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="cat">Category</Label>
            <select
              id="cat"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="flex h-11 w-full rounded-[var(--radius-md)] border border-border bg-bg-elevated px-3 text-sm"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c === "all" ? "All categories" : c}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-end gap-2 pb-2 text-sm text-fg-muted">
            <input
              type="checkbox"
              checked={nearMe}
              onChange={(e) => setNearMe(e.target.checked)}
              className="h-4 w-4"
            />
            Near my place
            {!person?.state && (
              <span className="text-xs text-fg-subtle">(set on Account)</span>
            )}
          </label>
          <label className="flex items-end gap-2 pb-2 text-sm text-fg-muted">
            <input
              type="checkbox"
              checked={l3Only}
              onChange={(e) => setL3Only(e.target.checked)}
              className="h-4 w-4"
            />
            Has L3+ signatures
          </label>
        </div>
        <p className="text-xs text-fg-subtle">
          Showing {filtered.length} of {petitions.length} campaigns
        </p>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-fg-muted">
          No campaigns match.{" "}
          <Link to="/create" className="font-medium text-accent">
            Start one
          </Link>{" "}
          or clear filters.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((p) => (
            <PetitionCard key={p.id} petition={p} />
          ))}
        </div>
      )}
    </div>
  );
}
