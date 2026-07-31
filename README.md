# Pulse

Two-way alignment signals between people and the leaders who serve them.

Owner definition: `life-produces-life-source-of-truth` → `_SOURCE_OF_TRUTH/07_PULSE__OWNER_DEFINITION.md`

## Product

- People start and sign **signals** (petitions with meaning + intensity)
- Leaders receive an inbox and can **respond in public**
- Hosting ≠ endorsement (shown on every petition)
- Leader-agnostic: elected officials, school boards, churches, HOAs, etc.

## Featured seed signals

1. **Georgia food-to-farms carve-out** — allow unsold, cooked, never-served kitchen food to go to local livestock under sanitation rules, without treating it as illegal “garbage.” (O.C.G.A. §§ 4-4-20–21)
2. **Consumption tax study & phase** — broaden what is collected beyond wage income so more real economic activity is fairly captured at federal and local levels, with protections for working families.

## Stack

TanStack Start, React 19, Tailwind v4, Zustand (local identity).  
**Database:** shared **LPL Supabase** tables `pulse_*` via service-role REST (not Neon). Signatures and leader responses are shared across devices.

## Not to confuse

- ChurchConnect **Journal Pulse** is a different feature (church engagement).
- `pulse.vercel.app` third-party heart-rate sites are unrelated.

## Scripts

```bash
npm run dev
npm run build
npm run typecheck
```

Domain target: `pulse.unitedundergod.org`
