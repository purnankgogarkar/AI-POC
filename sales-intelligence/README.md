# P² Focus — Supply Chain Sales Intelligence

Part of the [P² Suite](../README.md). A working prototype giving regional sales leadership a predictive, holistic view of open opportunities — on synthesized APAC channel-sales data (a manufacturer's B2B distributor/retail-chain accounts) — to guide where to focus sales effort.

## What it does

- **Overview** — a toggle between **By Account** (roll-up of each account's open pipeline) and **By Opportunity** (every open deal), both ranked by a blended priority score, with Country / Tier / Category / Stage filters.
- **Account detail** — account profile, average stall-risk trend, driver factors across its pipeline, and its own open opportunities.
- **Opportunity detail** — the full deal record, a breakdown of what's driving its score, a stall-risk trend, and plain-language recommended next actions.

The priority score blends **win probability** and **stall risk** (`amount × winProbability`, boosted for large deals at risk of stalling so they don't fall through the cracks) — a transparent, hand-specified heuristic (see `lib/scoring.ts`), not a trained ML model. This is prioritization for a human to act on; there's no rep leaderboard or auto-assignment.

## Run it

```bash
npm install
npm run seed   # regenerates the synthetic dataset deterministically
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Stack

Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui + Recharts + `next-themes` (dark/light). No backend — all data is a committed, seeded synthetic dataset in `data/`.
