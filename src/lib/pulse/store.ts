import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { SEED_LEADERS, SEED_PETITIONS } from "./seed";
import type {
  Intensity,
  Leader,
  LeaderResponse,
  Petition,
  Signature,
} from "./types";
import { slugify } from "@/lib/utils";

function id(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}

export interface PulseStore {
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
  setMe: (me: PulseStore["me"]) => void;
  signPetition: (input: {
    petitionId: string;
    name: string;
    email: string;
    city: string;
    state: string;
    intensity: Intensity;
    why?: string;
  }) => { ok: true } | { ok: false; error: string };
  createPetition: (input: {
    title: string;
    summary: string;
    body: string;
    ask: string;
    category: string;
    leaderId: string;
    createdByName: string;
  }) => Petition;
  respondAsLeader: (input: {
    petitionId: string;
    leaderId: string;
    message: string;
  }) => { ok: true } | { ok: false; error: string };
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
      me: null,
      setMe: (me) => set({ me }),
      signPetition: (input) => {
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
        const sig: Signature = {
          id: id("sig"),
          petitionId: input.petitionId,
          name: input.name.trim(),
          email,
          city: input.city.trim(),
          state: input.state.trim() || "GA",
          intensity: input.intensity,
          why: input.why?.trim() || undefined,
          signedAt: new Date().toISOString(),
        };
        set((s) => ({
          signatures: [sig, ...s.signatures],
          me: s.me ?? {
            name: sig.name,
            email: sig.email,
            city: sig.city,
            state: sig.state,
            isLeader: false,
          },
        }));
        return { ok: true };
      },
      createPetition: (input) => {
        const base = slugify(input.title) || "signal";
        let slug = base;
        let n = 2;
        while (get().petitions.some((p) => p.slug === slug)) {
          slug = `${base}-${n++}`;
        }
        const petition: Petition = {
          id: id("pet"),
          slug,
          title: input.title.trim(),
          summary: input.summary.trim(),
          body: input.body.trim(),
          ask: input.ask.trim(),
          category: input.category.trim() || "General",
          featured: false,
          status: "open",
          leaderId: input.leaderId,
          createdAt: new Date().toISOString(),
          createdByName: input.createdByName.trim() || "Neighbor",
          hostedNotEndorsed: true,
        };
        set((s) => ({ petitions: [petition, ...s.petitions] }));
        return petition;
      },
      respondAsLeader: (input) => {
        const petition = get().petitions.find((p) => p.id === input.petitionId);
        if (!petition) return { ok: false, error: "Signal not found." };
        if (petition.leaderId !== input.leaderId) {
          return {
            ok: false,
            error: "This signal is addressed to a different leader.",
          };
        }
        const response: LeaderResponse = {
          id: id("resp"),
          petitionId: input.petitionId,
          leaderId: input.leaderId,
          message: input.message.trim(),
          createdAt: new Date().toISOString(),
        };
        set((s) => ({
          responses: [response, ...s.responses],
          petitions: s.petitions.map((p) =>
            p.id === input.petitionId
              ? { ...p, status: "responded" as const }
              : p,
          ),
        }));
        return { ok: true };
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
          signatures: p.signatures ?? [],
          responses: p.responses ?? [],
          me: p.me ?? null,
        };
      },
      partialize: (s) => ({
        leaders: s.leaders,
        petitions: s.petitions,
        signatures: s.signatures,
        responses: s.responses,
        me: s.me,
      }),
    },
  ),
);

/** Call once on the client after mount */
export function rehydratePulse() {
  void usePulseStore.persist.rehydrate();
}
