import type { Leader, Petition } from "./types";

export const SEED_LEADERS: Leader[] = [
  {
    id: "ldr-ga-house-rockdale",
    name: "Georgia House member (Rockdale / Conyers)",
    title: "State Representative",
    kind: "elected",
    jurisdiction: "Georgia General Assembly — Rockdale County",
    contactNote: "Find your exact member at legis.ga.gov/find-my-legislator",
  },
  {
    id: "ldr-ga-senate-rockdale",
    name: "Georgia Senate member (Rockdale area)",
    title: "State Senator",
    kind: "elected",
    jurisdiction: "Georgia General Assembly — Rockdale region",
  },
  {
    id: "ldr-ga-ag",
    name: "Georgia Department of Agriculture",
    title: "State agriculture leadership",
    kind: "other",
    jurisdiction: "State of Georgia",
  },
];

export const SEED_PETITIONS: Petition[] = [
  {
    id: "pet-ga-food-feed-carveout",
    slug: "ga-unsold-cooked-food-to-local-farms",
    title:
      "Carve out Georgia law so unsold cooked kitchen food can feed local pigs and chickens",
    summary:
      "Allow same-day, cooked, never-served food from managed U.S. commercial and institutional kitchens to go to local farms instead of landfills — without treating it as illegal “garbage.”",
    body: `Georgia’s garbage-feeding rules (O.C.G.A. §§ 4-4-20–21) lump truly unsafe waste with good food that was prepared for people, never eaten, and still fit to feed animals.

We are not asking to feed pigs dumpster scrapings, plate waste, feces, or rotten food. We are asking for a narrow, common-sense carve-out:

**What should be allowed**
- Food prepared in a managed commercial or institutional kitchen (buffet line, school cafeteria, restaurant prep)
- Sourced through normal U.S. commercial distributors
- Cooked to human food-safety standards
- Never served / never eaten (unsold line leftovers)
- Handled cleanly and moved promptly to local farms for pigs or chickens

**Why this matters**
1. **Safety** — U.S. commercial herds are free of African swine fever and classical swine fever. Thoroughly cooked, same-day institutional leftovers from that supply chain are not the historical disease pathway the broad ban was written around.
2. **Climate** — Landfilling edible organics produces methane. Feeding animals or composting keeps carbon in a better cycle.
3. **Nutrition & farms** — Pigs and chickens are omnivores. Good leftover food is real nutrition and can lower feed cost for local growers.
4. **Local loop** — Citizens and kitchens stay connected to nearby farms instead of a one-way trip to the dump.

**What we still support restricting**
- Plate scrapings mixed with trash
- Unknown-origin cured meat products
- Putrid or unsafe waste
- Practices that ignore basic sanitation

Hosting this petition on Pulse is not an endorsement by any host organization of every political view — it is a lawful signal so leaders can see what people want.`,
    ask: "Amend Georgia’s garbage-feeding statutes (O.C.G.A. §§ 4-4-20–21) to allow diversion of unsold, cooked, never-served food from licensed U.S. commercial and institutional kitchens to local livestock under basic sanitation and timing rules, while keeping restrictions on plate waste and unknown meat products.",
    category: "Agriculture & food waste",
    featured: true,
    status: "open",
    leaderId: "ldr-ga-house-rockdale",
    createdAt: new Date().toISOString(),
    createdByName: "Georgia neighbors & local farms",
    hostedNotEndorsed: true,
  },
  {
    id: "pet-sample-school-lunch",
    slug: "local-school-board-lunch-leftovers-to-farms",
    title: "Let our school kitchen partner with a local farm for unsold cooked meals",
    summary:
      "Ask the school board to authorize a pilot: same-day unsold cafeteria food → nearby farm animals, with clear handling rules.",
    body: `Schools throw away large amounts of cooked food that students never took. A controlled pilot with a nearby farm can cut waste, teach students about stewardship, and support local agriculture.

This petition asks the board for a written pilot policy — not a free-for-all. Food must remain under kitchen control until transfer, and only never-served items are eligible.`,
    ask: "Authorize a written pilot for same-day unsold cooked cafeteria food to a local farm partner under sanitation guidelines.",
    category: "Schools",
    featured: false,
    status: "open",
    leaderId: "ldr-ga-house-rockdale",
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    createdByName: "Local parent",
    hostedNotEndorsed: true,
  },
];
