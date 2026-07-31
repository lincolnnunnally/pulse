import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, HeartHandshake, Megaphone, Scale } from "lucide-react";
import { HostingNotice } from "@/components/pulse/hosting-notice";
import { PetitionCard } from "@/components/pulse/petition-card";
import { usePulseStore } from "@/lib/pulse/store";
import { formatCount } from "@/lib/utils";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const petitions = usePulseStore((s) => s.petitions);
  const signatures = usePulseStore((s) => s.signatures);
  const featured = petitions.filter((p) => p.featured);
  const rest = petitions.filter((p) => !p.featured).slice(0, 2);

  return (
    <div>
      <section className="border-b border-border bg-primary text-primary-fg">
        <div className="page-shell grid gap-10 py-12 sm:py-16 lg:grid-cols-[1.2fr_0.8fr] lg:items-end lg:py-20">
          <div className="space-y-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-fg/70">
              Alignment, not noise
            </p>
            <h1 className="font-display text-balance text-3xl font-semibold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
              Help leaders hear what their people actually want
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-primary-fg/85 sm:text-lg">
              Pulse turns petitions into two-way signals — clear asks, real
              intensity, and a place for leaders to respond. Built so citizens
              and representatives can stay aligned without the antique stack of
              paper and form letters.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/p/$slug"
                params={{ slug: "ga-unsold-cooked-food-to-local-farms" }}
                className="inline-flex h-12 items-center justify-center rounded-[var(--radius-md)] bg-signal px-5 text-sm font-medium text-primary-fg no-underline hover:bg-signal/90"
              >
                Sign the Georgia food-to-farms signal
              </Link>
              <Link
                to="/p/$slug"
                params={{ slug: "modernize-us-tax-with-broad-consumption-tax" }}
                className="inline-flex h-12 items-center justify-center rounded-[var(--radius-md)] border border-primary-fg/25 bg-transparent px-5 text-sm font-medium text-primary-fg no-underline hover:bg-primary-fg/10"
              >
                Sign the consumption-tax study signal
              </Link>
              <Link
                to="/create"
                className="inline-flex h-12 items-center justify-center rounded-[var(--radius-md)] border border-primary-fg/25 bg-transparent px-5 text-sm font-medium text-primary-fg no-underline hover:bg-primary-fg/10"
              >
                Start your own signal
              </Link>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {[
              {
                label: "Open signals",
                value: formatCount(
                  petitions.filter((p) => p.status !== "closed").length,
                ),
              },
              {
                label: "Signatures here",
                value: formatCount(signatures.length),
              },
              {
                label: "Who it serves",
                value: "People + leaders",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-[var(--radius-lg)] border border-primary-fg/15 bg-primary-fg/5 px-4 py-3"
              >
                <p className="text-xs uppercase tracking-wide text-primary-fg/65">
                  {stat.label}
                </p>
                <p className="mt-1 font-display text-xl font-semibold">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="page-shell py-12 sm:py-16">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-semibold tracking-tight">
              Featured signal
            </h2>
            <p className="mt-1 text-sm text-fg-muted">
              Today’s asks: Georgia food-to-farms (not “garbage”), and a serious
              consumption-tax study so more real activity is fairly collected.
            </p>
          </div>
          <Link
            to="/petitions"
            className="inline-flex items-center gap-1 text-sm font-medium text-accent no-underline"
          >
            All signals <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {featured.map((p) => (
            <PetitionCard key={p.id} petition={p} />
          ))}
          {rest.map((p) => (
            <PetitionCard key={p.id} petition={p} />
          ))}
        </div>
        <div className="mt-6">
          <HostingNotice />
        </div>
      </section>

      <section className="border-y border-border bg-bg-elevated">
        <div className="page-shell grid gap-8 py-12 sm:grid-cols-3 sm:py-16">
          {[
            {
              icon: Megaphone,
              title: "Carry meaning up",
              body: "Not just a count — intensity, place, and a clear ask so leaders know what to do.",
            },
            {
              icon: Scale,
              title: "Leader-agnostic",
              body: "Works for legislators, school boards, pastors, HOAs, employers — any leader with a body of people.",
            },
            {
              icon: HeartHandshake,
              title: "Close the loop",
              body: "Leaders can answer inside Pulse. Signers see the response instead of shouting into a void.",
            },
          ].map((item) => (
            <div key={item.title} className="space-y-3">
              <span className="grid h-10 w-10 place-items-center rounded-[var(--radius-md)] bg-primary-soft text-primary">
                <item.icon className="h-5 w-5" />
              </span>
              <h3 className="font-display text-lg font-semibold">
                {item.title}
              </h3>
              <p className="text-sm leading-relaxed text-fg-muted">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="page-shell py-12 sm:py-16">
        <div className="surface-card flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="max-w-xl space-y-2">
            <h2 className="font-display text-xl font-semibold sm:text-2xl">
              Ready to put the food-waste carve-out in front of leaders?
            </h2>
            <p className="text-sm text-fg-muted">
              Sign once, share the link, and keep pressure local and clear.
            </p>
          </div>
          <Link
            to="/p/$slug"
            params={{ slug: "ga-unsold-cooked-food-to-local-farms" }}
            className="inline-flex h-12 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-primary px-6 text-sm font-medium text-primary-fg no-underline hover:bg-primary/90"
          >
            Open the petition
          </Link>
        </div>
      </section>
    </div>
  );
}
