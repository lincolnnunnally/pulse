import { createFileRoute, Link } from "@tanstack/react-router";
import { HostingNotice } from "@/components/pulse/hosting-notice";

export const Route = createFileRoute("/about")({
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="page-shell max-w-2xl space-y-6 py-10 sm:py-14">
      <h1 className="font-display text-3xl font-semibold tracking-tight">
        About Pulse
      </h1>
      <p className="text-base leading-relaxed text-fg-muted">
        Pulse helps people and leaders stay aligned. It modernizes petitioning:
        carry a clear ask up, show intensity and place, and let leaders respond
        so people know they were heard.
      </p>
      <p className="text-sm leading-relaxed text-fg-muted">
        Leaders are not limited to elected officials. Pulse is for anyone who
        leads a body of people — representatives, school boards, pastors, HOAs,
        employers, nonprofit boards — and needs a trustworthy signal from that
        body.
      </p>
      <HostingNotice />
      <p className="text-sm text-fg-muted">
        This build follows the Pulse owner definition: its own app, petition /
        signal as the core object, two-sided (people and leaders), with hosting
        ≠ endorsement.
      </p>
      <Link to="/" className="inline-block text-sm font-medium text-accent">
        Back home
      </Link>
    </div>
  );
}
