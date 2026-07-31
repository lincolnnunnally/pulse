import type { AddressStatus, VerificationLevel } from "./verify";

export type LeaderKind =
  | "elected"
  | "school_board"
  | "church"
  | "hoa"
  | "employer"
  | "nonprofit"
  | "other";

export type Intensity = 1 | 2 | 3 | 4 | 5;

export type PetitionStatus = "open" | "responded" | "closed";

export interface Leader {
  id: string;
  name: string;
  title: string;
  kind: LeaderKind;
  jurisdiction: string;
  /** Optional contact note shown on the petition */
  contactNote?: string;
  /** Why this seat can implement the change */
  whyTheyAct?: string;
  /** Public contact for mailto notify (never required) */
  notifyEmail?: string;
}

export interface Petition {
  id: string;
  slug: string;
  title: string;
  summary: string;
  body: string;
  ask: string;
  category: string;
  featured: boolean;
  status: PetitionStatus;
  leaderId: string;
  createdAt: string;
  createdByName: string;
  /** Hosting ≠ endorsement notice always shown */
  hostedNotEndorsed: true;
  /** Fork parent campaign id */
  parentId?: string;
  /** Why this leader seat is the right decision-maker */
  whyThisSeat?: string;
  /** Local place label e.g. "Rockdale County, GA" */
  localeLabel?: string;
}

export interface LeaderNotice {
  id: string;
  petitionId: string;
  leaderId: string;
  channel: "in_app" | "copy_email" | "mailto";
  status: "recorded" | "claimed_seen" | "responded";
  subject: string;
  body: string;
  sentByName: string;
  sentByEmail: string;
  createdAt: string;
}

export interface Signature {
  id: string;
  petitionId: string;
  name: string;
  email: string;
  city: string;
  state: string;
  zip?: string;
  intensity: Intensity;
  why?: string;
  signedAt: string;
  verificationLevel?: VerificationLevel;
  addressStatus?: AddressStatus;
  personId?: string;
}

export interface LeaderResponse {
  id: string;
  petitionId: string;
  leaderId: string;
  message: string;
  createdAt: string;
}

/** Logged-in Pulse person (D-P3 / D-P4). */
export interface PulsePerson {
  id: string;
  email: string;
  name: string;
  city: string;
  state: string;
  zip: string;
  street: string;
  emailVerified: boolean;
  placeConfirmed: boolean;
  addressStatus: AddressStatus;
  verificationLevel: VerificationLevel;
  isLeader: boolean;
  leaderId?: string;
}

export interface PulseState {
  leaders: Leader[];
  petitions: Petition[];
  signatures: Signature[];
  responses: LeaderResponse[];
  me: {
    name: string;
    email: string;
    city: string;
    state: string;
    isLeader: boolean;
    leaderId?: string;
  } | null;
}
