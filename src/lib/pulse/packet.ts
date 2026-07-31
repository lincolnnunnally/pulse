import type { Leader, Petition, Signature } from "./types";
import { LEVEL_LABELS, tallyByLevel, type VerificationLevel } from "./verify";
import { formatCount } from "@/lib/utils";

/** Formal notice packet for a decision-maker (honest counts by verification level). */
export function buildNotifyPacket(input: {
  petition: Petition;
  leader: Leader;
  signatures: Signature[];
  publicUrl: string;
  senderName: string;
}): { subject: string; body: string; mailto: string } {
  const { petition, leader, signatures, publicUrl, senderName } = input;
  const counts = tallyByLevel(
    signatures.map((s) => ({ verificationLevel: s.verificationLevel ?? 1 })),
  );
  const total = signatures.length;
  const l3plus = counts[3] + counts[4];
  const avg =
    total === 0
      ? 0
      : signatures.reduce((a, s) => a + s.intensity, 0) / total;

  const levelLines = ([3, 2, 1, 4] as VerificationLevel[])
    .filter((lv) => counts[lv] > 0 || lv !== 4)
    .map((lv) => `  L${lv} ${LEVEL_LABELS[lv]}: ${formatCount(counts[lv])}`)
    .join("\n");

  const subject = `Pulse signal: ${petition.title.slice(0, 80)}`;

  const body = `Dear ${leader.name},

This is a formal notice from Pulse (pulse.unitedundergod.org) about a public alignment signal addressed to your seat.

WHO CAN ACT (this seat)
${leader.title}
${leader.jurisdiction}
${leader.whyTheyAct || petition.whyThisSeat || "This seat is listed as the decision-maker for this ask."}

THE ASK
${petition.ask}

SUMMARY
${petition.summary}

VERIFIED SUPPORT (labeled by strength — not one unlabeled number)
Total signatures: ${formatCount(total)}
L3+ address-tier or stronger: ${formatCount(l3plus)}
Average intensity: ${total ? avg.toFixed(1) : "—"}/5
Breakdown:
${levelLines || "  (none yet)"}

PUBLIC SIGNAL
${publicUrl}

Hosting this signal is not an endorsement by Pulse or any host organization.
Counts are shared so you can filter to the strength of verification you trust.

Sent via Pulse by ${senderName}.
`;

  const email = leader.notifyEmail?.trim();
  const mailto = email
    ? `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    : "";

  return { subject, body, mailto };
}

export function buildNeighborShare(input: {
  petition: Petition;
  leader?: Leader;
  publicUrl: string;
  signatureCount: number;
}): string {
  const who = input.leader
    ? `Addressed to: ${input.leader.name} (${input.leader.title}).`
    : "";
  return `${input.petition.title}

${input.petition.summary}

${who}
${formatCount(input.signatureCount)} people have signed so far.

Join the signal: ${input.publicUrl}

Pulse — free for people. Hosting is not endorsement.`;
}
