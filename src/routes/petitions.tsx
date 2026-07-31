import { createFileRoute, Link } from "@tanstack/react-router";
import { HostingNotice } from "@/components/pulse/hosting-notice";
import { PetitionCard } from "@/components/pulse/petition-card";
import { usePulseStore } from "@/lib/pulse/store";

export const Route = createFileRoute("/petitions")({
  component: PetitionsPage,
});

function PetitionsPage() {
  const petitions = usePulseStore((s) => s.petitions);
  const sorted = [...petitions].sort((a, b) => {
    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    return +new Date(b.createdAt) - +new Date(a.createdAt);
  });

  return (
    <div className="page-shell py-10 sm:py-14">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            Signals
          </h1>
          <p className="max-w-2xl text-sm text-fg-muted sm:text-base">
            Lawful petitions people are sending to leaders. Sign, share, and
            watch for responses.
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
      <div className="grid gap-4 sm:grid-cols-2">
        {sorted.map((p) => (
          <PetitionCard key={p.id} petition={p} />
        ))}
      </div>
    </div>
  );
}
