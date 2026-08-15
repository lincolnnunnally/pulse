import { createServerFn } from "@tanstack/react-start";

const OWNER_FALLBACK = "lincoln@unitedundergod.org";

export type PulseCounts = {
  leaders: number | null;
  petitions: number | null;
  signatures: number | null;
  responses: number | null;
  people: number | null;
  notices: number | null;
};

export type OwnerDashboard =
  | { status: "signed_out" }
  | { status: "forbidden"; email: string | null }
  | { status: "ok"; email: string; counts: PulseCounts };

function ownerEmails(): string[] {
  const fromEnv = (process.env.APP_ENGINE_OWNER_EMAIL || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const set = new Set(fromEnv);
  set.add(OWNER_FALLBACK);
  return [...set];
}

export function isOwnerEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ownerEmails().includes(email.trim().toLowerCase());
}

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

async function countPulseTable(table: string): Promise<number | null> {
  if (!/^[a-z_]+$/.test(table)) return null;
  const cfg = supabaseConfig();
  if (!cfg) return null;
  try {
    const res = await fetch(`${cfg.url}/rest/v1/${table}?select=*`, {
      method: "GET",
      headers: {
        apikey: cfg.key,
        Authorization: `Bearer ${cfg.key}`,
        Prefer: "count=exact",
        Range: "0-0",
      },
    });
    if (!res.ok) return null;
    const range = res.headers.get("content-range");
    if (!range) return null;
    const total = range.split("/")[1];
    if (total === undefined || total === "*") return null;
    const n = Number(total);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

/** Real row counts from Pulse tables. Missing / unreachable → null. */
export async function loadPulseCounts(): Promise<PulseCounts> {
  const [leaders, petitions, signatures, responses, people, notices] =
    await Promise.all([
      countPulseTable("pulse_leaders"),
      countPulseTable("pulse_petitions"),
      countPulseTable("pulse_signatures"),
      countPulseTable("pulse_responses"),
      countPulseTable("pulse_people"),
      countPulseTable("pulse_notices"),
    ]);
  return { leaders, petitions, signatures, responses, people, notices };
}

export const getOwnerDashboard = createServerFn({ method: "GET" }).handler(
  async (): Promise<OwnerDashboard> => {
    const { getRequest } = await import("@tanstack/react-start/server");
    const { getPersonBySession, readSessionToken } = await import("./server");
    const request = getRequest();
    const person = request
      ? await getPersonBySession(readSessionToken(request))
      : null;
    if (!person) return { status: "signed_out" };
    if (!isOwnerEmail(person.email)) {
      return { status: "forbidden", email: person.email };
    }
    return {
      status: "ok",
      email: person.email,
      counts: await loadPulseCounts(),
    };
  },
);
