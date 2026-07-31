import { Building2, MapPin, Scale, Users } from "lucide-react";
import type { Leader, Petition } from "@/lib/pulse/types";

const KIND_LABEL: Record<Leader["kind"], string> = {
  elected: "Elected office",
  school_board: "School board",
  church: "Church / faith body",
  hoa: "HOA / neighborhood",
  employer: "Business / employer",
  nonprofit: "Nonprofit board",
  other: "Institution",
};

/** Clear “who can implement this change” block. */
export function ResponsibleSeat({
  leader,
  petition,
}: {
  leader?: Leader;
  petition: Petition;
}) {
  if (!leader) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-border bg-bg-elevated p-4 text-sm text-fg-muted">
        No decision-maker seat is linked yet. Fork this campaign and pick who can
        act in your area.
      </div>
    );
  }

  return (
    <div className="rounded-[var(--radius-lg)] border border-primary/20 bg-primary-soft/40 p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-primary">
        Who can implement this
      </p>
      <div className="mt-2 flex flex-wrap items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[var(--radius-md)] bg-primary text-primary-fg">
          {leader.kind === "elected" ? (
            <Scale className="h-5 w-5" />
          ) : leader.kind === "employer" ? (
            <Building2 className="h-5 w-5" />
          ) : (
            <Users className="h-5 w-5" />
          )}
        </span>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="font-display text-lg font-semibold text-fg">
            {leader.name}
          </p>
          <p className="text-sm text-fg-muted">
            {leader.title} · {KIND_LABEL[leader.kind]}
          </p>
          <p className="inline-flex items-start gap-1.5 text-xs text-fg-muted">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {leader.jurisdiction}
            {petition.localeLabel ? ` · ${petition.localeLabel}` : ""}
          </p>
        </div>
      </div>
      <div className="mt-4 space-y-2 text-sm leading-relaxed text-fg-muted">
        <p>
          <span className="font-medium text-fg">Why this seat:</span>{" "}
          {petition.whyThisSeat ||
            leader.whyTheyAct ||
            "This seat is listed as able to decide or implement the ask."}
        </p>
        {leader.whyTheyAct &&
          petition.whyThisSeat &&
          leader.whyTheyAct !== petition.whyThisSeat && (
            <p className="text-xs">
              <span className="font-medium text-fg">Seat authority:</span>{" "}
              {leader.whyTheyAct}
            </p>
          )}
        {leader.contactNote && (
          <p className="text-xs text-fg-subtle">{leader.contactNote}</p>
        )}
      </div>
    </div>
  );
}
