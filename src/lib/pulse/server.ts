import { SEED_LEADERS, SEED_PETITIONS } from "./seed";
import type {
  Intensity,
  Leader,
  LeaderResponse,
  Petition,
  Signature,
} from "./types";

type SharedSnapshot = {
  persistence: "lpl" | "local";
  leaders: Leader[];
  petitions: Petition[];
  signatures: Signature[];
  responses: LeaderResponse[];
  error?: string;
};

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
    intensity: Number(row.intensity) as Intensity,
    why: row.why ? String(row.why) : undefined,
    signedAt: String(row.signed_at),
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
  }));
  const leaderRes = await rest("pulse_leaders", {
    method: "POST",
    prefer: "resolution=merge-duplicates,return=minimal",
    body: JSON.stringify(leaders),
  });
  if (!leaderRes.ok && leaderRes.status !== 409) {
    // table missing or other error
    return { ok: false, error: leaderRes.error };
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
  }));
  const petRes = await rest("pulse_petitions", {
    method: "POST",
    prefer: "resolution=merge-duplicates,return=minimal",
    body: JSON.stringify(petitions),
  });
  if (!petRes.ok && petRes.status !== 409) {
    return { ok: false, error: petRes.error };
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
      error: seed.error,
    };
  }

  const [leadersRes, petitionsRes, sigRes, respRes] = await Promise.all([
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
      error: err,
    };
  }

  const dbLeaders = leadersRes.data.map(mapLeader);
  const dbPetitions = petitionsRes.data.map(mapPetition);

  // Always surface seed petitions (updated copy) + any user-created rows.
  const seedIds = new Set(SEED_PETITIONS.map((p) => p.id));
  const seedLeaderIds = new Set(SEED_LEADERS.map((l) => l.id));
  const userPets = dbPetitions.filter((p) => !seedIds.has(p.id));
  const petitions = [
    ...SEED_PETITIONS.map((seedPet) => {
      const row = dbPetitions.find((p) => p.id === seedPet.id);
      return row ? { ...seedPet, status: row.status } : seedPet;
    }),
    ...userPets,
  ];
  const userLeaders = dbLeaders.filter((l) => !seedLeaderIds.has(l.id));

  return {
    persistence: "lpl",
    leaders: [...SEED_LEADERS, ...userLeaders],
    petitions,
    signatures: sigRes.data.map(mapSignature),
    responses: respRes.data.map(mapResponse),
  };
}

export async function insertSignature(input: {
  petitionId: string;
  name: string;
  email: string;
  city: string;
  state: string;
  intensity: Intensity;
  why?: string;
}): Promise<{ ok: true; signature: Signature } | { ok: false; error: string }> {
  const email = input.email.trim().toLowerCase();
  if (!input.name.trim() || !email || !input.city.trim()) {
    return { ok: false, error: "Name, email, and city are required." };
  }
  if (!supabaseConfig()) {
    return { ok: false, error: "Shared database is not configured yet." };
  }

  await ensurePulseSeed();

  const id = `sig-${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
  const signedAt = new Date().toISOString();
  const row = {
    id,
    petition_id: input.petitionId,
    name: input.name.trim(),
    email,
    city: input.city.trim(),
    state: input.state.trim() || "GA",
    intensity: input.intensity,
    why: input.why?.trim() || null,
    signed_at: signedAt,
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
  const saved = Array.isArray(res.data) ? res.data[0] : (res.data as unknown as Record<string, unknown>);
  return { ok: true, signature: mapSignature(saved || row) };
}

export async function insertLeaderResponse(input: {
  petitionId: string;
  leaderId: string;
  message: string;
}): Promise<{ ok: true; response: LeaderResponse } | { ok: false; error: string }> {
  if (!input.message.trim()) {
    return { ok: false, error: "Response message is required." };
  }
  if (!supabaseConfig()) {
    return { ok: false, error: "Shared database is not configured yet." };
  }

  const id = `resp-${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
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

  // Mark petition responded
  await rest(`pulse_petitions?id=eq.${encodeURIComponent(input.petitionId)}`, {
    method: "PATCH",
    prefer: "return=minimal",
    body: JSON.stringify({ status: "responded" }),
  });

  const saved = Array.isArray(res.data) ? res.data[0] : (res.data as unknown as Record<string, unknown>);
  return { ok: true, response: mapResponse(saved || row) };
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
}): Promise<{ ok: true; petition: Petition } | { ok: false; error: string }> {
  if (!supabaseConfig()) {
    return { ok: false, error: "Shared database is not configured yet." };
  }
  await ensurePulseSeed();
  const id = `pet-${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
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
  };
  const res = await rest<Record<string, unknown>[]>("pulse_petitions", {
    method: "POST",
    prefer: "return=representation",
    body: JSON.stringify(row),
  });
  if (!res.ok) {
    return { ok: false, error: res.error || "Could not create signal." };
  }
  const saved = Array.isArray(res.data) ? res.data[0] : (res.data as unknown as Record<string, unknown>);
  return { ok: true, petition: mapPetition(saved || row) };
}

export function hasSupabaseConfig() {
  return Boolean(supabaseConfig());
}
