import { createFileRoute, Link } from "@tanstack/react-router";
// Link used for account CTA
import {
  CheckCircle2,
  Copy,
  MapPin,
  MessageSquareText,
  Share2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { HostingNotice } from "@/components/pulse/hosting-notice";
import { LevelCounts } from "@/components/pulse/level-counts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { usePulseStore } from "@/lib/pulse/store";
import type { Intensity, Petition } from "@/lib/pulse/types";
import { formatCount, formatDate } from "@/lib/utils";

export const Route = createFileRoute("/p/$slug")({
  component: PetitionDetailPage,
});

function PetitionDetailPage() {
  const { slug } = Route.useParams();
  const petitions = usePulseStore((s) => s.petitions);
  const petition = useMemo(
    () => petitions.find((p) => p.slug === slug),
    [petitions, slug],
  );

  if (!petition) {
    return (
      <div className="page-shell py-16 text-center">
        <h1 className="font-display text-2xl font-semibold">
          Signal not found
        </h1>
        <Link to="/petitions" className="mt-4 inline-block text-accent">
          Back to signals
        </Link>
      </div>
    );
  }

  return <PetitionBody petition={petition} />;
}

function PetitionBody({ petition }: { petition: Petition }) {
  const leaders = usePulseStore((s) => s.leaders);
  const allSignatures = usePulseStore((s) => s.signatures);
  const allResponses = usePulseStore((s) => s.responses);
  const me = usePulseStore((s) => s.me);
  const person = usePulseStore((s) => s.person);
  const signPetition = usePulseStore((s) => s.signPetition);
  const hasSignedFn = usePulseStore((s) => s.hasSigned);
  const avgIntensityFn = usePulseStore((s) => s.avgIntensity);

  const signatures = useMemo(
    () => allSignatures.filter((x) => x.petitionId === petition.id),
    [allSignatures, petition.id],
  );
  const responses = useMemo(
    () => allResponses.filter((r) => r.petitionId === petition.id),
    [allResponses, petition.id],
  );
  const leader = leaders.find((l) => l.id === petition.leaderId);
  const avgIntensity = avgIntensityFn(petition.id);
  const hasSigned = me ? hasSignedFn(petition.id, me.email) : false;

  const [name, setName] = useState(me?.name ?? person?.name ?? "");
  const [email, setEmail] = useState(me?.email ?? person?.email ?? "");
  const [city, setCity] = useState(me?.city ?? person?.city ?? "");
  const [state, setState] = useState(me?.state ?? person?.state ?? "GA");
  const [zip, setZip] = useState(me?.zip ?? person?.zip ?? "");
  const [intensity, setIntensity] = useState<Intensity>(4);
  const [why, setWhy] = useState("");
  const [done, setDone] = useState(false);

  const intensityBuckets = useMemo(() => {
    const buckets = [0, 0, 0, 0, 0];
    for (const s of signatures) buckets[s.intensity - 1] += 1;
    return buckets;
  }, [signatures]);

  async function onSign(e: React.FormEvent) {
    e.preventDefault();
    const result = await signPetition({
      petitionId: petition.id,
      name,
      email,
      city,
      state,
      zip,
      intensity,
      why,
    });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setDone(true);
    toast.success("You're on the signal. Share it with neighbors.");
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied");
    } catch {
      toast.message(window.location.href);
    }
  }

  return (
    <div className="page-shell py-8 sm:py-12">
      <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-start">
        <article className="space-y-6">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {petition.featured && <Badge variant="signal">Featured</Badge>}
              <Badge variant="muted">{petition.category}</Badge>
              {petition.status === "responded" && (
                <Badge variant="success">Leader responded</Badge>
              )}
            </div>
            <h1 className="font-display text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
              {petition.title}
            </h1>
            <p className="text-base text-fg-muted sm:text-lg">
              {petition.summary}
            </p>
          </div>

          <div className="surface-card grid gap-4 p-5 sm:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-fg-subtle">
                Signatures
              </p>
              <p className="mt-1 font-display text-2xl font-semibold tabular-nums">
                {formatCount(signatures.length)}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-fg-subtle">
                Avg. intensity
              </p>
              <p className="mt-1 font-display text-2xl font-semibold tabular-nums">
                {signatures.length ? avgIntensity.toFixed(1) : "—"}
                <span className="text-sm font-normal text-fg-subtle"> / 5</span>
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-fg-subtle">
                Opened
              </p>
              <p className="mt-1 font-display text-lg font-semibold">
                {formatDate(petition.createdAt)}
              </p>
            </div>
          </div>

          {signatures.length > 0 && (
            <div className="surface-card p-5">
              <h2 className="mb-3 font-display text-lg font-semibold">
                Verification mix
              </h2>
              <LevelCounts signatures={signatures} />
            </div>
          )}

          {leader && (
            <div className="rounded-[var(--radius-lg)] border border-border bg-primary-soft/50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                Addressed to
              </p>
              <p className="mt-1 font-medium text-fg">{leader.name}</p>
              <p className="text-sm text-fg-muted">
                {leader.title} · {leader.jurisdiction}
              </p>
              {leader.contactNote && (
                <p className="mt-2 inline-flex items-start gap-1.5 text-xs text-fg-muted">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {leader.contactNote}
                </p>
              )}
            </div>
          )}

          <div className="space-y-3">
            <h2 className="font-display text-xl font-semibold">The ask</h2>
            <p className="rounded-[var(--radius-lg)] border border-signal/30 bg-signal-soft/60 p-4 text-sm leading-relaxed text-fg">
              {petition.ask}
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="font-display text-xl font-semibold">
              Why this matters
            </h2>
            <div className="space-y-3 whitespace-pre-wrap text-sm leading-relaxed text-fg-muted">
              {petition.body}
            </div>
          </div>

          {responses.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-display text-xl font-semibold">
                Leader response
              </h2>
              {responses.map((r) => (
                <div
                  key={r.id}
                  className="rounded-[var(--radius-lg)] border border-success/25 bg-success-soft p-4"
                >
                  <div className="mb-2 flex items-center gap-2 text-success">
                    <MessageSquareText className="h-4 w-4" />
                    <span className="text-xs font-semibold uppercase tracking-wide">
                      Response · {formatDate(r.createdAt)}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-fg">
                    {r.message}
                  </p>
                </div>
              ))}
            </div>
          )}

          {signatures.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-display text-xl font-semibold">
                Intensity map
              </h2>
              <div className="space-y-2">
                {intensityBuckets.map((count, i) => {
                  const max = Math.max(...intensityBuckets, 1);
                  return (
                    <div key={i} className="flex items-center gap-3 text-xs">
                      <span className="w-14 text-fg-muted">{i + 1} / 5</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-bg-subtle">
                        <div
                          className="h-full rounded-full bg-accent transition-all"
                          style={{ width: `${(count / max) * 100}%` }}
                        />
                      </div>
                      <span className="w-8 tabular-nums text-fg-subtle">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <HostingNotice />
        </article>

        <aside className="space-y-4 lg:sticky lg:top-24">
          <div className="surface-card p-5">
            {done || hasSigned ? (
              <div className="space-y-4 text-center">
                <CheckCircle2 className="mx-auto h-10 w-10 text-success" />
                <div>
                  <h2 className="font-display text-lg font-semibold">
                    You're on this signal
                  </h2>
                  <p className="mt-1 text-sm text-fg-muted">
                    Share it so neighbors and lawmakers see the same clear ask.
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <Button type="button" onClick={copyLink} className="w-full">
                    <Share2 className="h-4 w-4" />
                    Copy share link
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={copyLink}
                    className="w-full"
                  >
                    <Copy className="h-4 w-4" />
                    Copy for email / Pulse share
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={onSign} className="space-y-4">
                <div>
                  <h2 className="font-display text-lg font-semibold">
                    Add your name
                  </h2>
                  <p className="mt-1 text-xs text-fg-muted">
                    Intensity tells leaders how much this matters to you — not
                    just that you clicked.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="name">Full name</Label>
                  <Input
                    id="name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    autoComplete="name"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Conyers"
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
                      placeholder="GA"
                      autoComplete="address-level1"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="zip">ZIP</Label>
                    <Input
                      id="zip"
                      value={zip}
                      onChange={(e) => setZip(e.target.value)}
                      placeholder="30012"
                      autoComplete="postal-code"
                    />
                  </div>
                </div>
                {!person && (
                  <p className="text-xs text-fg-muted">
                    <Link to="/account" className="font-medium text-accent">
                      Create a free account
                    </Link>{" "}
                    with street address so your signature counts at L3 for
                    lawmakers.
                  </p>
                )}
                <div className="space-y-2">
                  <Label>How important is this to you?</Label>
                  <div className="flex gap-2">
                    {([1, 2, 3, 4, 5] as Intensity[]).map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setIntensity(n)}
                        className={`h-11 flex-1 rounded-[var(--radius-md)] border text-sm font-medium transition-colors ${
                          intensity === n
                            ? "border-primary bg-primary text-primary-fg"
                            : "border-border bg-bg-elevated text-fg-muted hover:bg-bg-subtle"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-fg-subtle">
                    1 = mild support · 5 = top priority for my community
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="why">Optional note to leaders</Label>
                  <Textarea
                    id="why"
                    value={why}
                    onChange={(e) => setWhy(e.target.value)}
                    placeholder="One sentence on why this matters where you live…"
                    rows={3}
                  />
                </div>
                <Button type="submit" className="w-full" size="lg">
                  Sign this signal
                </Button>
                <p className="text-center text-[11px] text-fg-subtle">
                  Shared tally across devices. Counts are labeled by verification
                  strength (L1–L4) so leaders can trust what they act on.
                </p>
              </form>
            )}
          </div>

          <div className="rounded-[var(--radius-lg)] border border-border bg-bg-elevated p-4 text-xs leading-relaxed text-fg-muted">
            <p className="font-medium text-fg">For lawmakers reading this</p>
            <p className="mt-1">
              This is a narrow carve-out request, not a repeal of disease
              controls. Signatures include place and intensity so volume is not
              the only signal.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
