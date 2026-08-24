import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { SEED_LEADERS, SEED_PETITIONS } from "./seed";
import type {
  Intensity,
  Leader,
  LeaderNotice,
  LeaderResponse,
  Petition,
  PulsePerson,
  Signature,
} from "./types";
import { slugify } from "@/lib/utils";

export type PersistenceMode = "lpl" | "local" | "unknown";

export interface PulseStore {
  leaders: Leader[];
  petitions: Petition[];
  signatures: Signature[];
  responses: LeaderResponse[];
  notices: LeaderNotice[];
  persistence: PersistenceMode;
  sharedReady: boolean;
  hydrateError: string | null;
  person: PulsePerson | null;
  me: {
    name: string;
    email: string;
    city: string;
    state: string;
    zip?: string;
    isLeader: boolean;
    leaderId?: string;
  } | null;
  setMe: (me: PulseStore["me"]) => void;
  setPerson: (person: PulsePerson | null) => void;
  applyShared: (input: {
    leaders: Leader[];
    petitions: Petition[];
    signatures: Signature[];
    responses: LeaderResponse[];
    notices?: LeaderNotice[];
    persistence: PersistenceMode;
  }) => void;
  signPetition: (input: {
    petitionId: string;
    name: string;
    email: string;
    city: string;
    state: string;
    zip?: string;
    intensity: Intensity;
    why?: string;
  }) => Promise<{ ok: true } | { ok: false; error: string }>;
  createPetition: (input: {
    title: string;
    summary: string;
    body: string;
    ask: string;
    category: string;
    leaderId: string;
    createdByName: string;
    whyThisSeat?: string;
    localeLabel?: string;
    parentId?: string;
  }) => Promise<{ ok: true; petition: Petition } | { ok: false; error: string }>;
  respondAsLeader: (input: {
    petitionId: string;
    leaderId: string;
    message: string;
  }) => Promise<{ ok: true } | { ok: false; error: string }>;
  signatureCount: (petitionId: string) => number;
  hasSigned: (petitionId: string, email: string) => boolean;
  avgIntensity: (petitionId: string) => number;
}

const emptyStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

export const usePulseStore = create<PulseStore>()(
  persist(
    (set, get) => ({
      leaders: SEED_LEADERS,
      petitions: SEED_PETITIONS,
      signatures: [],
      responses: [],
      notices: [],
      persistence: "unknown",
      sharedReady: false,
      hydrateError: null,
      person: null,
      me: null,
      setMe: (me) => set({ me }),
      setPerson: (person) =>
        set({
          person,
          me: person
            ? {
                name: person.name,
                email: person.email,
                city: person.city,
                state: person.state,
                zip: person.zip,
                isLeader: person.isLeader,
                leaderId: person.leaderId,
              }
            : null,
        }),
      applyShared: (input) => {
        set({
          leaders: input.leaders.length ? input.leaders : SEED_LEADERS,
          petitions: input.petitions.length ? input.petitions : SEED_PETITIONS,
          signatures: input.signatures,
          responses: input.responses,
          notices: input.notices ?? [],
          persistence: input.persistence,
          sharedReady: true,
          hydrateError: null,
        });
      },
      signPetition: async (input) => {
        const email = input.email.trim().toLowerCase();
        if (!input.name.trim() || !email || !input.city.trim()) {
          return { ok: false, error: "Name, email, and city are required." };
        }
        if (get().hasSigned(input.petitionId, email)) {
          return { ok: false, error: "This email already signed this signal." };
        }
        const petition = get().petitions.find((p) => p.id === input.petitionId);
        if (!petition || petition.status === "closed") {
          return { ok: false, error: "This signal is not open for signatures." };
        }

        try {
          const res = await fetch("/api/signatures", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              petitionId: input.petitionId,
              name: input.name,
              email,
              city: input.city,
              state: input.state,
              zip: input.zip,
              intensity: input.intensity,
              why: input.why,
            }),
          });
          const data = (await res.json()) as {
            ok: boolean;
            error?: string;
            signature?: Signature;
          };
          if (res.ok && data.ok && data.signature) {
            const sig = data.signature;
            set((s) => ({
              signatures: [sig, ...s.signatures.filter((x) => x.id !== sig.id)],
              persistence: "lpl",
              me: s.me ?? {
                name: sig.name,
                email: sig.email,
                city: sig.city,
                state: sig.state,
                zip: sig.zip,
                isLeader: false,
              },
            }));
            return { ok: true };
          }
          return {
            ok: false,
            error: data.error || "Could not save signature.",
          };
        } catch {
          return {
            ok: false,
            error: "Could not reach Pulse. Try again — this was not counted.",
          };
        }
      },
      createPetition: async (input) => {
        const base = slugify(input.title) || "signal";
        let slug = base;
        let n = 2;
        while (get().petitions.some((p) => p.slug === slug)) {
          slug = `${base}-${n++}`;
        }

        try {
          const res = await fetch("/api/petitions", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...input,
              slug,
              whyThisSeat: input.whyThisSeat,
              localeLabel: input.localeLabel,
              parentId: input.parentId,
            }),
          });
          const data = (await res.json()) as {
            ok: boolean;
            error?: string;
            petition?: Petition;
          };
          if (res.ok && data.ok && data.petition) {
            const petition = data.petition;
            set((s) => ({
              petitions: [petition, ...s.petitions.filter((p) => p.id !== petition.id)],
              persistence: "lpl",
            }));
            return { ok: true, petition };
          }
          return {
            ok: false,
            error: data.error || "Could not publish this signal.",
          };
        } catch {
          return {
            ok: false,
            error: "Could not reach Pulse. Try again — this was not published.",
          };
        }
      },
      respondAsLeader: async (input) => {
        const petition = get().petitions.find((p) => p.id === input.petitionId);
        if (!petition) return { ok: false, error: "Signal not found." };
        if (petition.leaderId !== input.leaderId) {
          return {
            ok: false,
            error: "This signal is addressed to a different leader.",
          };
        }

        try {
          const res = await fetch("/api/responses", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
          });
          const data = (await res.json()) as {
            ok: boolean;
            error?: string;
            response?: LeaderResponse;
          };
          if (res.ok && data.ok && data.response) {
            const response = data.response;
            set((s) => ({
              responses: [response, ...s.responses.filter((r) => r.id !== response.id)],
              petitions: s.petitions.map((p) =>
                p.id === input.petitionId
                  ? { ...p, status: "responded" as const }
                  : p,
              ),
              persistence: "lpl",
            }));
            return { ok: true };
          }
          return {
            ok: false,
            error: data.error || "Could not post this response.",
          };
        } catch {
          return {
            ok: false,
            error: "Could not reach Pulse. Try again — this was not posted.",
          };
        }
      },
      signatureCount: (petitionId) =>
        get().signatures.filter((s) => s.petitionId === petitionId).length,
      hasSigned: (petitionId, email) =>
        get().signatures.some(
          (s) =>
            s.petitionId === petitionId &&
            s.email === email.trim().toLowerCase(),
        ),
      avgIntensity: (petitionId) => {
        const list = get().signatures.filter((s) => s.petitionId === petitionId);
        if (!list.length) return 0;
        return list.reduce((a, s) => a + s.intensity, 0) / list.length;
      },
    }),
    {
      name: "pulse-v1",
      storage: createJSONStorage(() =>
        typeof window === "undefined" ? emptyStorage : localStorage,
      ),
      skipHydration: true,
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<PulseStore>;
        const seedIds = new Set(SEED_PETITIONS.map((x) => x.id));
        const seedLeaderIds = new Set(SEED_LEADERS.map((x) => x.id));
        const userPets = (p.petitions ?? []).filter((x) => !seedIds.has(x.id));
        const petitions = [
          ...SEED_PETITIONS.map((seed) => {
            const old = (p.petitions ?? []).find((x) => x.id === seed.id);
            return old ? { ...seed, status: old.status } : seed;
          }),
          ...userPets,
        ];
        const userLeaders = (p.leaders ?? []).filter(
          (x) => !seedLeaderIds.has(x.id),
        );
        return {
          ...current,
          leaders: [...SEED_LEADERS, ...userLeaders],
          petitions,
          // Shared LPL will replace these on hydrate when available.
          signatures: p.signatures ?? [],
          responses: p.responses ?? [],
          me: p.me ?? null,
          persistence: "unknown",
          sharedReady: false,
          hydrateError: null,
        };
      },
      partialize: (s) => ({
        leaders: s.leaders,
        petitions: s.petitions,
        // Keep local me only; signatures come from shared when online.
        me: s.me,
      }),
    },
  ),
);

/** Call once on the client after mount */
export function rehydratePulse() {
  void usePulseStore.persist.rehydrate();
}

/** Pull shared LPL snapshot (signatures across devices) + session person. */
export async function syncSharedPulse() {
  try {
    const [stateRes, authRes] = await Promise.all([
      fetch("/api/state"),
      fetch("/api/auth", { credentials: "include" }),
    ]);
    const data = (await stateRes.json()) as {
      ok?: boolean;
      persistence?: PersistenceMode;
      error?: string;
      leaders?: Leader[];
      petitions?: Petition[];
      signatures?: Signature[];
      responses?: LeaderResponse[];
      notices?: LeaderNotice[];
    };
    if (data.ok && data.persistence === "lpl" && Array.isArray(data.signatures)) {
      usePulseStore.getState().applyShared({
        leaders: data.leaders ?? SEED_LEADERS,
        petitions: data.petitions ?? SEED_PETITIONS,
        signatures: data.signatures,
        responses: data.responses ?? [],
        notices: data.notices ?? [],
        persistence: "lpl",
      });
    } else {
      usePulseStore.setState({
        sharedReady: true,
        persistence: "local",
        hydrateError:
          data.error ||
          "Could not load shared Pulse data. Signature counts may be incomplete.",
      });
    }
    try {
      const auth = (await authRes.json()) as { person?: PulsePerson | null };
      if (auth.person) usePulseStore.getState().setPerson(auth.person);
    } catch {
      // no session
    }
  } catch {
    usePulseStore.setState({
      sharedReady: true,
      persistence: "local",
      hydrateError:
        "Could not reach Pulse. Signature counts may be incomplete — retry in a moment.",
    });
  }
}
