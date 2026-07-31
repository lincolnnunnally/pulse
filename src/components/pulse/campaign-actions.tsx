import { Copy, GitFork, Mail, Share2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buildNeighborShare, buildNotifyPacket } from "@/lib/pulse/packet";
import { usePulseStore } from "@/lib/pulse/store";
import type { Leader, Petition, Signature } from "@/lib/pulse/types";

export function CampaignActions({
  petition,
  leader,
  signatures,
}: {
  petition: Petition;
  leader?: Leader;
  signatures: Signature[];
}) {
  const leaders = usePulseStore((s) => s.leaders);
  const person = usePulseStore((s) => s.person);
  const me = usePulseStore((s) => s.me);
  const navigate = useNavigate();

  const [showFork, setShowFork] = useState(false);
  const [showNotify, setShowNotify] = useState(false);
  const [forkLeaderId, setForkLeaderId] = useState(leaders[0]?.id ?? "");
  const [localeLabel, setLocaleLabel] = useState(
    person?.city && person?.state
      ? `${person.city}, ${person.state}`
      : me?.city
        ? `${me.city}, ${me.state || "GA"}`
        : "",
  );
  const [busy, setBusy] = useState(false);

  const publicUrl =
    typeof window !== "undefined"
      ? window.location.href
      : `https://pulse.unitedundergod.org/p/${petition.slug}`;

  const packet = useMemo(() => {
    if (!leader) return null;
    return buildNotifyPacket({
      petition,
      leader,
      signatures,
      publicUrl,
      senderName: person?.name || me?.name || "A Pulse neighbor",
    });
  }, [leader, petition, signatures, publicUrl, person, me]);

  const shareText = useMemo(
    () =>
      buildNeighborShare({
        petition,
        leader,
        publicUrl,
        signatureCount: signatures.length,
      }),
    [petition, leader, publicUrl, signatures.length],
  );

  async function copyShare() {
    try {
      await navigator.clipboard.writeText(shareText);
      toast.success("Share text copied — send to a neighbor");
    } catch {
      toast.message(publicUrl);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(publicUrl);
      toast.success("Link copied");
    } catch {
      toast.message(publicUrl);
    }
  }

  async function copyPacket() {
    if (!packet || !leader) return;
    setBusy(true);
    try {
      await navigator.clipboard.writeText(packet.body);
      await recordNotice("copy_email", packet.subject, packet.body);
      toast.success("Notice packet copied — paste into email to the office");
    } catch {
      toast.error("Could not copy packet");
    } finally {
      setBusy(false);
    }
  }

  function openMailto() {
    if (!packet?.mailto) {
      toast.message(
        "No public email on this seat — copy the packet and send via the office contact you trust.",
      );
      return;
    }
    void recordNotice("mailto", packet.subject, packet.body);
    window.location.href = packet.mailto;
  }

  async function recordNotice(
    channel: "in_app" | "copy_email" | "mailto",
    subject: string,
    body: string,
  ) {
    if (!leader) return;
    await fetch("/api/notices", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        petitionId: petition.id,
        leaderId: leader.id,
        channel,
        subject,
        body,
        sentByName: person?.name || me?.name || "Neighbor",
        sentByEmail: person?.email || me?.email || "",
      }),
    });
  }

  async function sendInAppNotice() {
    if (!packet || !leader) return;
    setBusy(true);
    try {
      const res = await fetch("/api/notices", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          petitionId: petition.id,
          leaderId: leader.id,
          channel: "in_app",
          subject: packet.subject,
          body: packet.body,
          sentByName: person?.name || me?.name || "Neighbor",
          sentByEmail: person?.email || me?.email || "",
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        toast.error(data.error || "Could not record notice");
        return;
      }
      toast.success(
        "In-app notice recorded for this seat. Claimed leaders see it in their inbox.",
      );
      setShowNotify(false);
    } finally {
      setBusy(false);
    }
  }

  async function forkCampaign() {
    if (!forkLeaderId) {
      toast.error("Pick who can act in your area");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/fork", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentId: petition.id,
          leaderId: forkLeaderId,
          localeLabel: localeLabel.trim(),
          createdByName: person?.name || me?.name || "Neighbor",
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        petition?: Petition;
      };
      if (!res.ok || !data.ok || !data.petition) {
        toast.error(data.error || "Could not fork campaign");
        return;
      }
      // refresh store via page nav
      usePulseStore.setState((s) => ({
        petitions: [
          data.petition!,
          ...s.petitions.filter((p) => p.id !== data.petition!.id),
        ],
      }));
      toast.success("Local campaign created — share it with neighbors");
      navigate({ to: "/p/$slug", params: { slug: data.petition.slug } });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2">
        <Button type="button" variant="secondary" onClick={copyShare}>
          <Share2 className="h-4 w-4" />
          Share with a neighbor
        </Button>
        <Button type="button" variant="secondary" onClick={copyLink}>
          <Copy className="h-4 w-4" />
          Copy link
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            setShowFork((v) => !v);
            setShowNotify(false);
          }}
        >
          <GitFork className="h-4 w-4" />
          Run this in my area
        </Button>
        <Button
          type="button"
          onClick={() => {
            setShowNotify((v) => !v);
            setShowFork(false);
          }}
        >
          <Mail className="h-4 w-4" />
          Notify the person in charge
        </Button>
      </div>

      {showFork && (
        <div className="space-y-3 rounded-[var(--radius-md)] border border-border bg-bg-elevated p-4">
          <p className="text-sm font-medium text-fg">
            Fork this campaign for your place
          </p>
          <p className="text-xs text-fg-muted">
            Same ask and case — new seat and local label. Signatures start at
            zero for your area.
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="locale">Your place label</Label>
            <Input
              id="locale"
              value={localeLabel}
              onChange={(e) => setLocaleLabel(e.target.value)}
              placeholder="e.g. Cobb County, GA"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fork-leader">Who can act there?</Label>
            <select
              id="fork-leader"
              value={forkLeaderId}
              onChange={(e) => setForkLeaderId(e.target.value)}
              className="flex h-11 w-full rounded-[var(--radius-md)] border border-border bg-bg px-3 text-sm focus-ring"
            >
              {leaders.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} — {l.jurisdiction}
                </option>
              ))}
            </select>
          </div>
          <Button type="button" onClick={forkCampaign} disabled={busy}>
            {busy ? "Creating…" : "Create local campaign"}
          </Button>
        </div>
      )}

      {showNotify && leader && packet && (
        <div className="space-y-3 rounded-[var(--radius-md)] border border-border bg-bg-elevated p-4">
          <p className="text-sm font-medium text-fg">
            Notify {leader.name}
          </p>
          <p className="text-xs text-fg-muted">
            We do not spam offices. You send the message (or record an in-app
            notice for a claimed seat). Counts stay labeled by verification
            strength.
          </p>
          <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded-[var(--radius-sm)] border border-border bg-bg p-2 text-[11px] text-fg-muted">
            {packet.body.slice(0, 900)}
            {packet.body.length > 900 ? "…" : ""}
          </pre>
          <div className="flex flex-col gap-2">
            <Button type="button" onClick={copyPacket} disabled={busy}>
              Copy email packet
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={openMailto}
              disabled={busy}
            >
              Open email app
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={sendInAppNotice}
              disabled={busy}
            >
              Record in-app notice for seat
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
