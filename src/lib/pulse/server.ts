import { SEED_LEADERS, SEED_PETITIONS } from "./seed";
import { hashPassword, newId, newToken, verifyPassword } from "./crypto";
import {
  computeVerificationLevel,
  type AddressStatus,
  type VerificationLevel,
} from "./verify";
import type {
  Intensity,
  Leader,
  LeaderNotice,
  LeaderResponse,
  Petition,
  PulsePerson,
  Signature,
} from "./types";

type SharedSnapshot = {
  persistence: "lpl" | "local";
  leaders: Leader[];
  petitions: Petition[];
  signatures: Signature[];
  responses: LeaderResponse[];
  notices: LeaderNotice[];
  error?: string;
};

const SESSION_DAYS = 30;
const COOKIE_NAME = "pulse_session";

function supabaseConfig() {
  const url = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "")
    .trim()
    .replace(/\/$/, "");
  const key = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    ""
  ).trim();
  return url && key ? { url, key } : null;
}

async function rest<T>(
  path: string,
  init?: RequestInit & { prefer?: string },
): Promise<{ ok: true; data: T } | { ok: false; error: string; status: number }> {
  const cfg = supabaseConfig();
  if (!cfg) {
    return { ok: false, error: "Supabase not configured", status: 503 };
  }
  const headers: Record<string, string> = {
    apikey: cfg.key,
    Authorization: `Bearer ${cfg.key}`,
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string> | undefined),
  };
  if (init?.prefer) headers.Prefer = init.prefer;
  try {
    const res = await fetch(`${cfg.url}/rest/v1/${path}`, {
      ...init,
      headers,
    });
    const text = await res.text();
    if (!res.ok) {
      return {
        ok: false,
        error: text.slice(0, 300) || res.statusText,
        status: res.status,
      };
    }
    const data = text ? (JSON.parse(text) as T) : (null as T);
    return { ok: true, data };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, error: message.slice(0, 300), status: 500 };
  }
}

function mapLeader(row: Record<string, unknown>): Leader {
  return {
    id: String(row.id),
    name: String(row.name),
    title: String(row.title),
    kind: row.kind as Leader["kind"],
    jurisdiction: String(row.jurisdiction),
    contactNote: row.contact_note ? String(row.contact_note) : undefined,
    whyTheyAct: row.why_they_act ? String(row.why_they_act) : undefined,
    notifyEmail: row.notify_email ? String(row.notify_email) : undefined,
  };
}

function mapPetition(row: Record<string, unknown>): Petition {
  return {
    id: String(row.id),
    slug: String(row.slug),
    title: String(row.title),
    summary: String(row.summary),
    body: String(row.body),
    ask: String(row.ask),
    category: String(row.category || "General"),
    featured: Boolean(row.featured),
    status: (row.status as Petition["status"]) || "open",
    leaderId: String(row.leader_id),
    createdAt: String(row.created_at),
    createdByName: String(row.created_by_name || "Neighbor"),
    hostedNotEndorsed: true,
    parentId: row.parent_id ? String(row.parent_id) : undefined,
    whyThisSeat: row.why_this_seat ? String(row.why_this_seat) : undefined,
    localeLabel: row.locale_label ? String(row.locale_label) : undefined,
  };
}

function mapNotice(row: Record<string, unknown>): LeaderNotice {
  return {
    id: String(row.id),
    petitionId: String(row.petition_id),
    leaderId: String(row.leader_id),
    channel: (String(row.channel || "in_app") as LeaderNotice["channel"]) || "in_app",
    status: (String(row.status || "recorded") as LeaderNotice["status"]) || "recorded",
    subject: String(row.subject || ""),
    body: String(row.body || ""),
    sentByName: String(row.sent_by_name || "Neighbor"),
    sentByEmail: String(row.sent_by_email || ""),
    createdAt: String(row.created_at),
  };
}

function mapSignature(row: Record<string, unknown>): Signature {
  return {
    id: String(row.id),
    petitionId: String(row.petition_id),
    name: String(row.name),
    email: String(row.email),
    city: String(row.city),
    state: String(row.state || "GA"),
    zip: row.zip ? String(row.zip) : undefined,
    intensity: Number(row.intensity) as Intensity,
    why: row.why ? String(row.why) : undefined,
    signedAt: String(row.signed_at),
    verificationLevel: (Number(row.verification_level) || 1) as VerificationLevel,
    addressStatus: (String(row.address_status || "none") as AddressStatus) || "none",
    personId: row.person_id ? String(row.person_id) : undefined,
  };
}

function mapResponse(row: Record<string, unknown>): LeaderResponse {
  return {
    id: String(row.id),
    petitionId: String(row.petition_id),
    leaderId: String(row.leader_id),
    message: String(row.message),
    createdAt: String(row.created_at),
  };
}

function mapPerson(row: Record<string, unknown>): PulsePerson {
  return {
    id: String(row.id),
    email: String(row.email),
    name: String(row.name),
    city: String(row.city || ""),
    state: String(row.state || ""),
    zip: String(row.zip || ""),
    street: String(row.street || ""),
    emailVerified: Boolean(row.email_verified),
    placeConfirmed: Boolean(row.place_confirmed),
    addressStatus: (String(row.address_status || "none") as AddressStatus) || "none",
    verificationLevel: (Number(row.verification_level) || 1) as VerificationLevel,
    isLeader: Boolean(row.is_leader),
    leaderId: row.leader_id ? String(row.leader_id) : undefined,
  };
}

function personLevel(p: {
  emailVerified: boolean;
  placeConfirmed: boolean;
  addressStatus: AddressStatus;
}): VerificationLevel {
  return computeVerificationLevel(p);
}

/** Ensure seed leaders + petitions exist in LPL (idempotent upsert). */
export async function ensurePulseSeed(): Promise<{ ok: boolean; error?: string }> {
  if (!supabaseConfig()) return { ok: false, error: "Supabase not configured" };

  const leaders = SEED_LEADERS.map((l) => ({
    id: l.id,
    name: l.name,
    title: l.title,
    kind: l.kind,
    jurisdiction: l.jurisdiction,
    contact_note: l.contactNote ?? null,
    why_they_act: l.whyTheyAct ?? "",
    notify_email: l.notifyEmail ?? null,
  }));
  const leaderRes = await rest("pulse_leaders", {
    method: "POST",
    prefer: "resolution=merge-duplicates,return=minimal",
    body: JSON.stringify(leaders),
  });
  if (!leaderRes.ok && leaderRes.status !== 409) {
    // retry without new columns if migration not applied
    const fallback = await rest("pulse_leaders", {
      method: "POST",
      prefer: "resolution=merge-duplicates,return=minimal",
      body: JSON.stringify(
        SEED_LEADERS.map((l) => ({
          id: l.id,
          name: l.name,
          title: l.title,
          kind: l.kind,
          jurisdiction: l.jurisdiction,
          contact_note: l.contactNote ?? null,
        })),
      ),
    });
    if (!fallback.ok && fallback.status !== 409) {
      return { ok: false, error: leaderRes.error };
    }
  }

  const petitions = SEED_PETITIONS.map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    summary: p.summary,
    body: p.body,
    ask: p.ask,
    category: p.category,
    featured: p.featured,
    status: p.status,
    leader_id: p.leaderId,
    created_at: p.createdAt,
    created_by_name: p.createdByName,
    hosted_not_endorsed: true,
    parent_id: p.parentId ?? null,
    why_this_seat: p.whyThisSeat ?? "",
    locale_label: p.localeLabel ?? "",
  }));
  const petRes = await rest("pulse_petitions", {
    method: "POST",
    prefer: "resolution=merge-duplicates,return=minimal",
    body: JSON.stringify(petitions),
  });
  if (!petRes.ok && petRes.status !== 409) {
    const fallback = await rest("pulse_petitions", {
      method: "POST",
      prefer: "resolution=merge-duplicates,return=minimal",
      body: JSON.stringify(
        SEED_PETITIONS.map((p) => ({
          id: p.id,
          slug: p.slug,
          title: p.title,
          summary: p.summary,
          body: p.body,
          ask: p.ask,
          category: p.category,
          featured: p.featured,
          status: p.status,
          leader_id: p.leaderId,
          created_at: p.createdAt,
          created_by_name: p.createdByName,
          hosted_not_endorsed: true,
        })),
      ),
    });
    if (!fallback.ok && fallback.status !== 409) {
      return { ok: false, error: petRes.error };
    }
  }
  return { ok: true };
}

export async function loadSharedPulse(): Promise<SharedSnapshot> {
  if (!supabaseConfig()) {
    return {
      persistence: "local",
      leaders: SEED_LEADERS,
      petitions: SEED_PETITIONS,
      signatures: [],
      responses: [],
      notices: [],
      error: "Supabase not configured",
    };
  }

  const seed = await ensurePulseSeed();
  if (!seed.ok) {
    return {
      persistence: "local",
      leaders: SEED_LEADERS,
      petitions: SEED_PETITIONS,
      signatures: [],
      responses: [],
      notices: [],
      error: seed.error,
    };
  }

  const [leadersRes, petitionsRes, sigRes, respRes, noticeRes] =
    await Promise.all([
      rest<Record<string, unknown>[]>("pulse_leaders?select=*&order=name.asc"),
      rest<Record<string, unknown>[]>(
        "pulse_petitions?select=*&order=created_at.desc",
      ),
      rest<Record<string, unknown>[]>(
        "pulse_signatures?select=*&order=signed_at.desc",
      ),
      rest<Record<string, unknown>[]>(
        "pulse_responses?select=*&order=created_at.desc",
      ),
      rest<Record<string, unknown>[]>(
        "pulse_notices?select=*&order=created_at.desc&limit=200",
      ),
    ]);

  if (!leadersRes.ok || !petitionsRes.ok || !sigRes.ok || !respRes.ok) {
    const err =
      (!leadersRes.ok && leadersRes.error) ||
      (!petitionsRes.ok && petitionsRes.error) ||
      (!sigRes.ok && sigRes.error) ||
      (!respRes.ok && respRes.error) ||
      "load failed";
    return {
      persistence: "local",
      leaders: SEED_LEADERS,
      petitions: SEED_PETITIONS,
      signatures: [],
      responses: [],
      notices: [],
      error: err,
    };
  }

  const dbLeaders = leadersRes.data.map(mapLeader);
  const dbPetitions = petitionsRes.data.map(mapPetition);
  const seedIds = new Set(SEED_PETITIONS.map((p) => p.id));
  const seedLeaderIds = new Set(SEED_LEADERS.map((l) => l.id));
  const userPets = dbPetitions.filter((p) => !seedIds.has(p.id));
  const petitions = [
    ...SEED_PETITIONS.map((seedPet) => {
      const row = dbPetitions.find((p) => p.id === seedPet.id);
      return row
        ? {
            ...seedPet,
            status: row.status,
            parentId: row.parentId ?? seedPet.parentId,
            whyThisSeat: row.whyThisSeat || seedPet.whyThisSeat,
            localeLabel: row.localeLabel || seedPet.localeLabel,
          }
        : seedPet;
    }),
    ...userPets,
  ];
  const userLeaders = dbLeaders.filter((l) => !seedLeaderIds.has(l.id));
  // Prefer seed enrichment for whyTheyAct when DB row lacks it
  const leaders = [
    ...SEED_LEADERS.map((seedL) => {
      const row = dbLeaders.find((l) => l.id === seedL.id);
      return row
        ? {
            ...seedL,
            ...row,
            whyTheyAct: row.whyTheyAct || seedL.whyTheyAct,
            contactNote: row.contactNote || seedL.contactNote,
          }
        : seedL;
    }),
    ...userLeaders,
  ];

  return {
    persistence: "lpl",
    leaders,
    petitions,
    signatures: sigRes.data.map(mapSignature),
    responses: respRes.data.map(mapResponse),
    notices: noticeRes.ok ? noticeRes.data.map(mapNotice) : [],
  };
}

async function createSession(personId: string): Promise<string> {
  const token = newToken();
  const expires = new Date(Date.now() + SESSION_DAYS * 864e5).toISOString();
  const res = await rest("pulse_sessions", {
    method: "POST",
    prefer: "return=minimal",
    body: JSON.stringify({
      token,
      person_id: personId,
      expires_at: expires,
    }),
  });
  if (!res.ok) throw new Error(res.error || "Could not create session");
  return token;
}

export function sessionCookieHeader(token: string, maxAgeSec = SESSION_DAYS * 86400) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSec}${secure}`;
}

export function clearSessionCookieHeader() {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}

export function readSessionToken(request: Request): string | null {
  const cookie = request.headers.get("cookie") || "";
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export async function getPersonBySession(
  token: string | null,
): Promise<PulsePerson | null> {
  if (!token || !supabaseConfig()) return null;
  const sess = await rest<Record<string, unknown>[]>(
    `pulse_sessions?token=eq.${encodeURIComponent(token)}&select=*&limit=1`,
  );
  if (!sess.ok || !sess.data?.length) return null;
  const row = sess.data[0];
  if (new Date(String(row.expires_at)).getTime() < Date.now()) return null;
  const people = await rest<Record<string, unknown>[]>(
    `pulse_people?id=eq.${encodeURIComponent(String(row.person_id))}&select=*&limit=1`,
  );
  if (!people.ok || !people.data?.length) return null;
  return mapPerson(people.data[0]);
}

export async function registerPerson(input: {
  email: string;
  password: string;
  name: string;
  city: string;
  state: string;
  zip?: string;
  street?: string;
}): Promise<
  | { ok: true; person: PulsePerson; token: string }
  | { ok: false; error: string }
> {
  const email = input.email.trim().toLowerCase();
  if (!email || !input.password || input.password.length < 8) {
    return { ok: false, error: "Email and a password of at least 8 characters are required." };
  }
  if (!input.name.trim() || !input.city.trim()) {
    return { ok: false, error: "Name and city are required." };
  }
  if (!supabaseConfig()) return { ok: false, error: "Database not configured." };
  await ensurePulseSeed();

  const city = input.city.trim();
  const state = (input.state.trim() || "GA").slice(0, 2).toUpperCase();
  const zip = (input.zip || "").trim();
  const street = (input.street || "").trim();
  const placeConfirmed = Boolean(city && state && zip);
  const addressStatus: AddressStatus = street
    ? "self_reported"
    : "none";
  const level = personLevel({
    emailVerified: true, // account email is the login identity for this MVP
    placeConfirmed,
    addressStatus,
  });

  const id = newId("ppl");
  const row = {
    id,
    email,
    password_hash: hashPassword(input.password),
    name: input.name.trim(),
    city,
    state,
    zip,
    street,
    email_verified: true,
    place_confirmed: placeConfirmed,
    address_status: addressStatus,
    verification_level: level,
    is_leader: false,
    leader_id: null,
    updated_at: new Date().toISOString(),
  };

  const res = await rest<Record<string, unknown>[]>("pulse_people", {
    method: "POST",
    prefer: "return=representation",
    body: JSON.stringify(row),
  });
  if (!res.ok) {
    if (res.status === 409 || res.error.toLowerCase().includes("duplicate")) {
      return { ok: false, error: "An account with this email already exists. Sign in instead." };
    }
    return { ok: false, error: res.error || "Could not create account." };
  }
  const saved = Array.isArray(res.data) ? res.data[0] : row;
  const person = mapPerson(saved as Record<string, unknown>);
  const token = await createSession(person.id);
  return { ok: true, person, token };
}

export async function loginPerson(input: {
  email: string;
  password: string;
}): Promise<
  | { ok: true; person: PulsePerson; token: string }
  | { ok: false; error: string }
> {
  const email = input.email.trim().toLowerCase();
  if (!email || !input.password) {
    return { ok: false, error: "Email and password are required." };
  }
  if (!supabaseConfig()) return { ok: false, error: "Database not configured." };

  const people = await rest<Record<string, unknown>[]>(
    `pulse_people?email=eq.${encodeURIComponent(email)}&select=*&limit=1`,
  );
  if (!people.ok || !people.data?.length) {
    return { ok: false, error: "No account found for that email." };
  }
  const row = people.data[0];
  if (!verifyPassword(input.password, String(row.password_hash))) {
    return { ok: false, error: "Incorrect password." };
  }
  const person = mapPerson(row);
  const token = await createSession(person.id);
  return { ok: true, person, token };
}

export async function logoutSession(token: string | null): Promise<void> {
  if (!token) return;
  await rest(`pulse_sessions?token=eq.${encodeURIComponent(token)}`, {
    method: "DELETE",
    prefer: "return=minimal",
  });
}

export async function updatePersonProfile(
  personId: string,
  input: {
    name?: string;
    city?: string;
    state?: string;
    zip?: string;
    street?: string;
  },
): Promise<{ ok: true; person: PulsePerson } | { ok: false; error: string }> {
  const people = await rest<Record<string, unknown>[]>(
    `pulse_people?id=eq.${encodeURIComponent(personId)}&select=*&limit=1`,
  );
  if (!people.ok || !people.data?.length) {
    return { ok: false, error: "Account not found." };
  }
  const cur = people.data[0];
  const name = (input.name ?? String(cur.name)).trim();
  const city = (input.city ?? String(cur.city || "")).trim();
  const state = ((input.state ?? String(cur.state || "GA")).trim() || "GA")
    .slice(0, 2)
    .toUpperCase();
  const zip = (input.zip ?? String(cur.zip || "")).trim();
  const street = (input.street ?? String(cur.street || "")).trim();
  const placeConfirmed = Boolean(city && state && zip);
  let addressStatus = String(cur.address_status || "none") as AddressStatus;
  if (street) {
    if (addressStatus === "none") addressStatus = "self_reported";
  } else {
    addressStatus = "none";
  }
  const level = personLevel({
    emailVerified: Boolean(cur.email_verified),
    placeConfirmed,
    addressStatus,
  });

  const patch = {
    name,
    city,
    state,
    zip,
    street,
    place_confirmed: placeConfirmed,
    address_status: addressStatus,
    verification_level: level,
    updated_at: new Date().toISOString(),
  };
  const res = await rest<Record<string, unknown>[]>(
    `pulse_people?id=eq.${encodeURIComponent(personId)}`,
    {
      method: "PATCH",
      prefer: "return=representation",
      body: JSON.stringify(patch),
    },
  );
  if (!res.ok) return { ok: false, error: res.error || "Could not update profile." };
  const saved = Array.isArray(res.data) ? res.data[0] : { ...cur, ...patch };
  return { ok: true, person: mapPerson(saved as Record<string, unknown>) };
}

export async function claimLeaderSeat(input: {
  personId: string;
  leaderId: string;
  note?: string;
}): Promise<{ ok: true; person: PulsePerson } | { ok: false; error: string }> {
  await ensurePulseSeed();
  if (!SEED_LEADERS.some((l) => l.id === input.leaderId)) {
    // still allow if in DB
    const check = await rest<Record<string, unknown>[]>(
      `pulse_leaders?id=eq.${encodeURIComponent(input.leaderId)}&select=id&limit=1`,
    );
    if (!check.ok || !check.data?.length) {
      return { ok: false, error: "Unknown leader seat." };
    }
  }

  const claimId = newId("claim");
  await rest("pulse_leader_claims", {
    method: "POST",
    prefer: "resolution=merge-duplicates,return=minimal",
    body: JSON.stringify({
      id: claimId,
      leader_id: input.leaderId,
      person_id: input.personId,
      status: "verified", // pilot: self-claim with honesty notice; staff review later
      note: input.note?.trim() || "Self-claim pilot — seat verification pending full review",
    }),
  });

  const res = await rest<Record<string, unknown>[]>(
    `pulse_people?id=eq.${encodeURIComponent(input.personId)}`,
    {
      method: "PATCH",
      prefer: "return=representation",
      body: JSON.stringify({
        is_leader: true,
        leader_id: input.leaderId,
        updated_at: new Date().toISOString(),
      }),
    },
  );
  if (!res.ok) return { ok: false, error: res.error || "Could not claim seat." };
  const saved = Array.isArray(res.data) ? res.data[0] : null;
  if (!saved) return { ok: false, error: "Could not claim seat." };
  return { ok: true, person: mapPerson(saved) };
}

export async function insertSignature(input: {
  petitionId: string;
  name: string;
  email: string;
  city: string;
  state: string;
  zip?: string;
  intensity: Intensity;
  why?: string;
  person?: PulsePerson | null;
}): Promise<{ ok: true; signature: Signature } | { ok: false; error: string }> {
  const email = input.email.trim().toLowerCase();
  if (!input.name.trim() || !email || !input.city.trim()) {
    return { ok: false, error: "Name, email, and city are required." };
  }
  if (!supabaseConfig()) {
    return { ok: false, error: "Shared database is not configured yet." };
  }

  await ensurePulseSeed();

  const person = input.person;
  const placeConfirmed = Boolean(
    person?.placeConfirmed || (input.city && input.state && (input.zip || person?.zip)),
  );
  const addressStatus: AddressStatus = person?.addressStatus || "none";
  const level: VerificationLevel = person
    ? person.verificationLevel
    : personLevel({
        emailVerified: false,
        placeConfirmed,
        addressStatus: "none",
      });

  // Require at least account-level for counted support when signed out — still allow guest
  // but label as L1-weak: guests are L1 with place if zip provided
  const guestLevel: VerificationLevel = placeConfirmed ? 2 : 1;
  const verificationLevel = person ? level : guestLevel;

  const id = newId("sig");
  const signedAt = new Date().toISOString();
  const row = {
    id,
    petition_id: input.petitionId,
    name: input.name.trim(),
    email,
    city: input.city.trim(),
    state: input.state.trim() || "GA",
    zip: (input.zip || person?.zip || "").trim(),
    intensity: input.intensity,
    why: input.why?.trim() || null,
    signed_at: signedAt,
    verification_level: verificationLevel,
    address_status: person?.addressStatus || "none",
    person_id: person?.id || null,
  };

  const res = await rest<Record<string, unknown>[]>("pulse_signatures", {
    method: "POST",
    prefer: "return=representation",
    body: JSON.stringify(row),
  });
  if (!res.ok) {
    if (res.error.toLowerCase().includes("duplicate") || res.status === 409) {
      return { ok: false, error: "This email already signed this signal." };
    }
    return { ok: false, error: res.error || "Could not save signature." };
  }
  const saved = Array.isArray(res.data) ? res.data[0] : row;
  return { ok: true, signature: mapSignature(saved as Record<string, unknown>) };
}

export async function insertLeaderResponse(input: {
  petitionId: string;
  leaderId: string;
  message: string;
  person?: PulsePerson | null;
}): Promise<{ ok: true; response: LeaderResponse } | { ok: false; error: string }> {
  if (!input.message.trim()) {
    return { ok: false, error: "Response message is required." };
  }
  if (!supabaseConfig()) {
    return { ok: false, error: "Shared database is not configured yet." };
  }

  // Production: require claimed seat (D-P4)
  if (
    !input.person?.isLeader ||
    !input.person.leaderId ||
    input.person.leaderId !== input.leaderId
  ) {
    return {
      ok: false,
      error:
        "Only a claimed leader seat can post a public response. Sign in and claim this seat under For leaders.",
    };
  }

  const id = newId("resp");
  const createdAt = new Date().toISOString();
  const row = {
    id,
    petition_id: input.petitionId,
    leader_id: input.leaderId,
    message: input.message.trim(),
    created_at: createdAt,
  };
  const res = await rest<Record<string, unknown>[]>("pulse_responses", {
    method: "POST",
    prefer: "return=representation",
    body: JSON.stringify(row),
  });
  if (!res.ok) {
    return { ok: false, error: res.error || "Could not save response." };
  }

  await rest(`pulse_petitions?id=eq.${encodeURIComponent(input.petitionId)}`, {
    method: "PATCH",
    prefer: "return=minimal",
    body: JSON.stringify({ status: "responded" }),
  });

  const saved = Array.isArray(res.data) ? res.data[0] : row;
  return { ok: true, response: mapResponse(saved as Record<string, unknown>) };
}

export async function insertPetition(input: {
  title: string;
  summary: string;
  body: string;
  ask: string;
  category: string;
  leaderId: string;
  createdByName: string;
  slug: string;
  parentId?: string;
  whyThisSeat?: string;
  localeLabel?: string;
}): Promise<{ ok: true; petition: Petition } | { ok: false; error: string }> {
  if (!supabaseConfig()) {
    return { ok: false, error: "Shared database is not configured yet." };
  }
  await ensurePulseSeed();
  const leader =
    SEED_LEADERS.find((l) => l.id === input.leaderId) ||
    (
      await rest<Record<string, unknown>[]>(
        `pulse_leaders?id=eq.${encodeURIComponent(input.leaderId)}&select=*&limit=1`,
      )
    ).data?.[0];
  const whyDefault =
    input.whyThisSeat?.trim() ||
    (leader && "whyTheyAct" in leader
      ? String((leader as Leader).whyTheyAct || "")
      : leader && typeof leader === "object"
        ? String((leader as Record<string, unknown>).why_they_act || "")
        : "");

  const id = newId("pet");
  const createdAt = new Date().toISOString();
  const row = {
    id,
    slug: input.slug,
    title: input.title.trim(),
    summary: input.summary.trim(),
    body: input.body.trim(),
    ask: input.ask.trim(),
    category: input.category.trim() || "General",
    featured: false,
    status: "open",
    leader_id: input.leaderId,
    created_at: createdAt,
    created_by_name: input.createdByName.trim() || "Neighbor",
    hosted_not_endorsed: true,
    parent_id: input.parentId || null,
    why_this_seat: whyDefault,
    locale_label: input.localeLabel?.trim() || "",
  };
  let res = await rest<Record<string, unknown>[]>("pulse_petitions", {
    method: "POST",
    prefer: "return=representation",
    body: JSON.stringify(row),
  });
  if (!res.ok && res.error.includes("parent_id")) {
    const { parent_id: _p, why_this_seat: _w, locale_label: _l, ...basic } = row;
    res = await rest<Record<string, unknown>[]>("pulse_petitions", {
      method: "POST",
      prefer: "return=representation",
      body: JSON.stringify(basic),
    });
  }
  if (!res.ok) {
    return { ok: false, error: res.error || "Could not create signal." };
  }
  const saved = Array.isArray(res.data) ? res.data[0] : row;
  const petition = mapPetition(saved as Record<string, unknown>);
  return {
    ok: true,
    petition: {
      ...petition,
      parentId: petition.parentId || input.parentId,
      whyThisSeat: petition.whyThisSeat || whyDefault,
      localeLabel: petition.localeLabel || input.localeLabel,
    },
  };
}

export async function forkPetition(input: {
  parentId: string;
  leaderId: string;
  localeLabel: string;
  createdByName: string;
}): Promise<{ ok: true; petition: Petition } | { ok: false; error: string }> {
  await ensurePulseSeed();
  const snap = await loadSharedPulse();
  const parent =
    snap.petitions.find((p) => p.id === input.parentId) ||
    SEED_PETITIONS.find((p) => p.id === input.parentId);
  if (!parent) return { ok: false, error: "Parent campaign not found." };

  const leader =
    snap.leaders.find((l) => l.id === input.leaderId) ||
    SEED_LEADERS.find((l) => l.id === input.leaderId);
  if (!leader) return { ok: false, error: "Pick a valid leader seat." };

  const locale = input.localeLabel.trim() || leader.jurisdiction;
  const title =
    parent.title.length > 90
      ? `${parent.title.slice(0, 87)}…`
      : parent.title;
  const baseSlug = `${parent.slug}-local`.slice(0, 60);
  const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;

  return insertPetition({
    title: `${title} (${locale})`,
    summary: parent.summary,
    body: `${parent.body}\n\n---\nLocal campaign forked for **${locale}**. Parent signal: ${parent.slug}.`,
    ask: parent.ask,
    category: parent.category,
    leaderId: input.leaderId,
    createdByName: input.createdByName,
    slug,
    parentId: parent.id,
    whyThisSeat:
      leader.whyTheyAct ||
      parent.whyThisSeat ||
      "Local decision-maker for this fork.",
    localeLabel: locale,
  });
}

export async function insertNotice(input: {
  petitionId: string;
  leaderId: string;
  channel: LeaderNotice["channel"];
  subject: string;
  body: string;
  sentByName: string;
  sentByEmail: string;
}): Promise<{ ok: true; notice: LeaderNotice } | { ok: false; error: string }> {
  if (!supabaseConfig()) {
    return { ok: false, error: "Database not configured." };
  }
  if (!input.subject.trim() || !input.body.trim()) {
    return { ok: false, error: "Notice subject and body are required." };
  }
  const id = newId("notice");
  const row = {
    id,
    petition_id: input.petitionId,
    leader_id: input.leaderId,
    channel: input.channel,
    status: "recorded",
    subject: input.subject.trim(),
    body: input.body.trim(),
    sent_by_name: input.sentByName.trim() || "Neighbor",
    sent_by_email: input.sentByEmail.trim().toLowerCase(),
    created_at: new Date().toISOString(),
  };
  const res = await rest<Record<string, unknown>[]>("pulse_notices", {
    method: "POST",
    prefer: "return=representation",
    body: JSON.stringify(row),
  });
  if (!res.ok) {
    return {
      ok: false,
      error:
        res.error.includes("pulse_notices") || res.status === 404
          ? "Notice table not ready yet — copy the packet and email the office directly."
          : res.error || "Could not record notice.",
    };
  }
  const saved = Array.isArray(res.data) ? res.data[0] : row;
  return { ok: true, notice: mapNotice(saved as Record<string, unknown>) };
}

export function hasSupabaseConfig() {
  return Boolean(supabaseConfig());
}
