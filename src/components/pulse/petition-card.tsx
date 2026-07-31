import { Link } from "@tanstack/react-router";
import { ArrowRight, MapPin, Users } from "lucide-react";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { usePulseStore } from "@/lib/pulse/store";
import type { Petition } from "@/lib/pulse/types";
import { formatCount, formatDate } from "@/lib/utils";

export function PetitionCard({ petition }: { petition: Petition }) {
  const leaders = usePulseStore((s) => s.leaders);
  const allSignatures = usePulseStore((s) => s.signatures);
  const signatures = useMemo(
    () => allSignatures.filter((x) => x.petitionId === petition.id),
    [allSignatures, petition.id],
  );
  const leader = leaders.find((l) => l.id === petition.leaderId);

  return (
    <Link
      to="/p/$slug"
      params={{ slug: petition.slug }}
      className="surface-card group flex flex-col gap-4 p-5 no-underline transition-shadow hover:shadow-md"
    >
      <div className="flex flex-wrap items-center gap-2">
        {petition.featured && <Badge variant="signal">Featured</Badge>}
        <Badge variant="muted">{petition.category}</Badge>
        {petition.status === "responded" && (
          <Badge variant="success">Leader responded</Badge>
        )}
      </div>
      <div className="space-y-2">
        <h3 className="font-display text-lg font-semibold leading-snug text-fg group-hover:text-primary">
          {petition.title}
        </h3>
        <p className="line-clamp-3 text-sm leading-relaxed text-fg-muted">
          {petition.summary}
        </p>
      </div>
      <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-fg-subtle">
        <span className="inline-flex items-center gap-1">
          <Users className="h-3.5 w-3.5" />
          {formatCount(signatures.length)} signed
        </span>
        {leader && (
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {leader.jurisdiction}
          </span>
        )}
        <span>{formatDate(petition.createdAt)}</span>
      </div>
      <span className="inline-flex items-center gap-1 text-sm font-medium text-accent">
        View signal
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}
