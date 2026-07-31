import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { LevelCounts } from "@/components/pulse/level-counts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { usePulseStore } from "@/lib/pulse/store";
import type { PulsePerson } from "@/lib/pulse/types";
import { formatCount, formatDate } from "@/lib/utils";

export const Route = createFileRoute("/leaders")({
  component: LeadersPage,
});

function LeadersPage() {
  const leaders = usePulseStore((s) => s.leaders);
  const petitions = usePulseStore((s) => s.petitions);
  const signatures = usePulseStore((s) => s.signatures);
  const person = usePulseStore((s) => s.person);
  const setPerson = usePulseStore((s) => s.setPerson);
  const respondAsLeader = usePulseStore((s) => s.respondAsLeader);
  const avgIntensity = usePulseStore((s) => s.avgIntensity);

  const [leaderId, setLeaderId] = useState(
    person?.leaderId ?? leaders[0]?.id ?? "",
  );
  const [replyFor, setReplyFor] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [claiming, setClaiming] = useState(false);

  const inbox = useMemo(
    () =>
      petitions
        .filter((p) => p.leaderId === leaderId)
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    [petitions, leaderId],
  );

  const leader = leaders.find((l) => l.id === leaderId);
  const seatClaimed =
    Boolean(person?.isLeader && person.leaderId === leaderId);

  async function claimSeat() {
    if (!leader) return;
    if (!person) {
      toast.error("Sign in first — free account required to claim a seat.");
      return;
    }
    setClaiming(true);
    try {
      const res = await fetch("/api/claim-leader", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leaderId: leader.id }),
      });
      const data = (await res.json()) as {
        ok: boolean;
        error?: string;
        person?: PulsePerson;
      };
      if (!res.ok || !data.ok || !data.person) {
        toast.error(data.error || "Could not claim seat");
        return;
      }
      setPerson(data.person);
      toast.success(
        `Seat claimed: ${leader.name}. Public responses now post from this seat.`,
      );
    } finally {
      setClaiming(false);
    }
  }

  async function sendResponse(petitionId: string) {
    const result = await respondAsLeader({ petitionId, leaderId, message });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Response posted to the signal");
    setReplyFor(null);
    setMessage("");
  }

  return (
    <div className="page-shell py-10 sm:py-14">
      <div className="mb-8 max-w-2xl space-y-2">
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Leader inbox
        </h1>
        <p className="text-sm text-fg-muted sm:text-base">
          Claimed seats close the loop: see labeled constituent support, then
          post a public response. Free for people; leader tools stay free in this
          pilot (Pro dashboards later).
        </p>
      </div>

      {!person && (
        <div className="surface-card mb-6 border-signal/30 bg-signal-soft/40 p-4 text-sm">
          <p className="font-medium text-fg">Sign in to claim a seat</p>
          <p className="mt-1 text-fg-muted">
            Production responses require a claimed leader account (D-P4).{" "}
            <Link to="/account" className="font-medium text-accent">
              Create a free account
            </Link>
            .
          </p>
        </div>
      )}

      <div className="surface-card mb-8 flex flex-col gap-4 p-5 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="seat">Leader seat</Label>
          <select
            id="seat"
            value={leaderId}
            onChange={(e) => setLeaderId(e.target.value)}
            className="flex h-11 w-full rounded-[var(--radius-md)] border border-border bg-bg-elevated px-3 text-sm focus-ring"
          >
            {leaders.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>
        <Button
          type="button"
          onClick={claimSeat}
          disabled={claiming || seatClaimed}
        >
          {seatClaimed
            ? "Seat claimed"
            : claiming
              ? "Claiming…"
              : "Claim this seat"}
        </Button>
      </div>

      {seatClaimed && leader && (
        <p className="mb-6 text-sm text-success">
          You are responding as <strong>{leader.name}</strong>.
        </p>
      )}

      <div className="space-y-4">
        {inbox.length === 0 && (
          <p className="text-sm text-fg-muted">No signals for this seat yet.</p>
        )}
        {inbox.map((p) => {
          const sigs = signatures.filter((s) => s.petitionId === p.id);
          const count = sigs.length;
          const intensity = avgIntensity(p.id);
          return (
            <div key={p.id} className="surface-card space-y-4 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant={p.status === "responded" ? "success" : "muted"}
                    >
                      {p.status === "responded" ? "Responded" : "Open"}
                    </Badge>
                    <Badge variant="outline">{p.category}</Badge>
                  </div>
                  <h2 className="font-display text-lg font-semibold">
                    <Link
                      to="/p/$slug"
                      params={{ slug: p.slug }}
                      className="text-fg no-underline hover:text-primary"
                    >
                      {p.title}
                    </Link>
                  </h2>
                  <p className="text-sm text-fg-muted">{p.ask}</p>
                </div>
                <div className="text-right text-sm">
                  <p className="font-semibold tabular-nums">
                    {formatCount(count)} signatures
                  </p>
                  <p className="text-fg-subtle">
                    Intensity {count ? intensity.toFixed(1) : "—"}/5
                  </p>
                  <p className="text-xs text-fg-subtle">
                    {formatDate(p.createdAt)}
                  </p>
                </div>
              </div>

              {count > 0 && (
                <div className="rounded-[var(--radius-md)] border border-border bg-bg-elevated p-3">
                  <LevelCounts signatures={sigs} />
                </div>
              )}

              {replyFor === p.id ? (
                <div className="space-y-3 border-t border-border pt-4">
                  <Label htmlFor={`msg-${p.id}`}>Your response (public)</Label>
                  <Textarea
                    id={`msg-${p.id}`}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    placeholder="Acknowledge the ask, what you'll do next, or why you can't."
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      onClick={() => sendResponse(p.id)}
                      disabled={!seatClaimed}
                    >
                      Post response
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setReplyFor(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                  {!seatClaimed && (
                    <p className="text-xs text-fg-subtle">
                      Claim this seat first to post a public response.
                    </p>
                  )}
                </div>
              ) : (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setReplyFor(p.id);
                    setMessage("");
                  }}
                >
                  Respond
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
