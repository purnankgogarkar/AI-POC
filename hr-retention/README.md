# P² Retain — Workforce Retention Intelligence

Part of the [P² Suite](../README.md). A working prototype that scores attrition risk on synthesized workforce data and rolls it up to **group level** (department, location, department × location, or job role) for HR and business leadership — plus a secondary employee-level explorer for validation.

## What it does

- **Overview** — group-level risk ranking with a switchable aggregation dimension, driver factors in business language, and retention suggestions per group.
- **Group detail** — risk trend, factor breakdown, ranked recommended actions, and a "mark investigated" toggle.
- **Employee Explorer** — individual-level search/filter/drill-down, kept separate from the group view. No retention action is ever generated for a named individual — only for groups.

The scoring is a transparent, hand-specified heuristic (see `lib/scoring.ts`), not a trained ML model — the point of this prototype is the workflow and UX, not model accuracy.

## Run it

```bash
npm install
npm run seed   # regenerates the synthetic dataset deterministically
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Stack

Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui + Recharts + `next-themes` (dark/light). No backend — all data is a committed, seeded synthetic dataset in `data/`, and interactive state (e.g. "mark investigated") is held in the browser's `localStorage`.
