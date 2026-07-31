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
}

export interface Signature {
  id: string;
  petitionId: string;
  name: string;
  email: string;
  city: string;
  state: string;
  intensity: Intensity;
  why?: string;
  signedAt: string;
}

export interface LeaderResponse {
  id: string;
  petitionId: string;
  leaderId: string;
  message: string;
  createdAt: string;
}

export interface PulseState {
  leaders: Leader[];
  petitions: Petition[];
  signatures: Signature[];
  responses: LeaderResponse[];
  /** Local identity for this browser (demo) */
  me: {
    name: string;
    email: string;
    city: string;
    state: string;
    isLeader: boolean;
    leaderId?: string;
  } | null;
}
