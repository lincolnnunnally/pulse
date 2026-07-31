import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { usePulseStore } from "@/lib/pulse/store";
import { formatCount, formatDate } from "@/lib/utils";

export const Route = createFileRoute("/leaders")({
  component: LeadersPage,
});

function LeadersPage() {
  const leaders = usePulseStore((s) => s.leaders);
  const petitions = usePulseStore((s) => s.petitions);
  const signatures = usePulseStore((s) => s.signatures);
  const me = usePulseStore((s) => s.me);
  const setMe = usePulseStore((s) => s.setMe);
  const respondAsLeader = usePulseStore((s) => s.respondAsLeader);
  const avgIntensity = usePulseStore((s) => s.avgIntensity);

  const [leaderId, setLeaderId] = useState(
    me?.leaderId ?? leaders[0]?.id ?? "",
  );
  const [replyFor, setReplyFor] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const inbox = useMemo(
    () =>
      petitions
        .filter((p) => p.leaderId === leaderId)
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
    [petitions, leaderId],
  );

  const leader = leaders.find((l) => l.id === leaderId);

  function claimInbox() {
    if (!leader) return;
    setMe({
      name: me?.name || leader.name,
      email: me?.email || "leader@example.com",
      city: me?.city || "Georgia",
      state: me?.state || "GA",
      isLeader: true,
      leaderId: leader.id,
    });
    toast.success(`Viewing inbox as ${leader.name}`);
  }

  function sendResponse(petitionId: string) {
    const result = respondAsLeader({ petitionId, leaderId, message });
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
          See what people are asking, how strongly they care, and close the loop
          with a public response. Demo mode — pick a leader seat to try it.
        </p>
      </div>

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
        <Button type="button" onClick={claimInbox}>
          Use this inbox
        </Button>
      </div>

      <div className="space-y-4">
        {inbox.length === 0 && (
          <p className="text-sm text-fg-muted">No signals for this seat yet.</p>
        )}
        {inbox.map((p) => {
          const count = signatures.filter((s) => s.petitionId === p.id).length;
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
                    <Button type="button" onClick={() => sendResponse(p.id)}>
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
