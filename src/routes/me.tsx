import { createFileRoute, Link } from "@tanstack/react-router";
import { usePulseStore } from "@/lib/pulse/store";
import { formatDate } from "@/lib/utils";

export const Route = createFileRoute("/me")({
  component: MePage,
});

function MePage() {
  const me = usePulseStore((s) => s.me);
  const signatures = usePulseStore((s) => s.signatures);
  const petitions = usePulseStore((s) => s.petitions);
  const mine = me
    ? signatures.filter((s) => s.email === me.email)
    : [];

  return (
    <div className="page-shell max-w-2xl py-10 sm:py-14">
      <h1 className="font-display text-3xl font-semibold tracking-tight">
        My pulse
      </h1>
      <p className="mt-2 text-sm text-fg-muted">
        Signals you've joined on this device.
      </p>

      {!me && mine.length === 0 && (
        <div className="surface-card mt-8 p-6 text-sm text-fg-muted">
          You haven't signed anything yet.{" "}
          <Link
            to="/p/$slug"
            params={{ slug: "ga-unsold-cooked-food-to-local-farms" }}
            className="font-medium text-accent"
          >
            Start with the Georgia food-to-farms signal
          </Link>
          .
        </div>
      )}

      {me && (
        <div className="surface-card mt-6 p-5 text-sm">
          <p className="font-medium text-fg">{me.name}</p>
          <p className="text-fg-muted">
            {me.city}, {me.state} · {me.email}
          </p>
          {me.isLeader && (
            <p className="mt-2 text-xs text-primary">Leader inbox mode active</p>
          )}
        </div>
      )}

      <ul className="mt-8 space-y-3">
        {mine.map((sig) => {
          const pet = petitions.find((p) => p.id === sig.petitionId);
          if (!pet) return null;
          return (
            <li key={sig.id} className="surface-card p-4">
              <Link
                to="/p/$slug"
                params={{ slug: pet.slug }}
                className="font-medium text-fg no-underline hover:text-primary"
              >
                {pet.title}
              </Link>
              <p className="mt-1 text-xs text-fg-subtle">
                Signed {formatDate(sig.signedAt)} · intensity {sig.intensity}/5
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
