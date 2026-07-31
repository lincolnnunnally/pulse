/** D-P3 verification ladder — single source for labels and scoring. */

export type VerificationLevel = 1 | 2 | 3 | 4;
export type AddressStatus = "none" | "self_reported" | "pending" | "verified";

export const LEVEL_LABELS: Record<VerificationLevel, string> = {
  1: "Account",
  2: "Place stated",
  3: "Address-tier",
  4: "Strong ID",
};

export const LEVEL_SHORT: Record<VerificationLevel, string> = {
  1: "L1",
  2: "L2",
  3: "L3",
  4: "L4",
};

export function computeVerificationLevel(input: {
  emailVerified: boolean;
  placeConfirmed: boolean;
  addressStatus: AddressStatus;
  strongId?: boolean;
}): VerificationLevel {
  if (input.strongId) return 4;
  if (input.addressStatus === "verified") return 3;
  if (input.addressStatus === "self_reported" || input.addressStatus === "pending") {
    // Self-reported address is address-tier but labeled weaker in UI via addressStatus
    return 3;
  }
  if (input.placeConfirmed) return 2;
  return 1;
}

export function verificationBadge(level: VerificationLevel, addressStatus?: AddressStatus) {
  if (level >= 4) return { label: "ID-verified", tone: "strong" as const };
  if (level >= 3 && addressStatus === "verified") {
    return { label: "Address-verified", tone: "strong" as const };
  }
  if (level >= 3) {
    return { label: "Address provided", tone: "mid" as const };
  }
  if (level >= 2) return { label: "Place stated", tone: "mid" as const };
  return { label: "Account", tone: "base" as const };
}

export type LevelCounts = Record<VerificationLevel, number>;

export function emptyLevelCounts(): LevelCounts {
  return { 1: 0, 2: 0, 3: 0, 4: 0 };
}

export function tallyByLevel(
  signatures: { verificationLevel?: number }[],
): LevelCounts {
  const c = emptyLevelCounts();
  for (const s of signatures) {
    const lv = Math.min(4, Math.max(1, Number(s.verificationLevel) || 1)) as VerificationLevel;
    c[lv] += 1;
  }
  return c;
}
