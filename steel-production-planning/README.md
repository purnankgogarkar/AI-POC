# P² Assemble — Production Package Pre-Population

Part of the [P² Suite](../README.md). A working prototype that assembles a draft production package from available information, pre-populates what it can determine, and flags what's missing, conflicting, ambiguous, or low-confidence — so a planner reviews and approves rather than building the package from scratch, on synthesized package data.

## What it does

- **Dashboard** — the 8 recommended KPIs (cycle time, planner effort, first-pass completeness, exception rate, rework rate, planner capacity, on-time release, downstream impact), explicitly labeled as illustrative — no current-state baseline exists to compare against.
- **Packages** — a searchable, filterable, paginated queue by status (Draft Generated / Needs Review / Approved / Released).
- **Planner Workbench** — the full requirements checklist for a package, each row tagged **Rule-derived**, **AI-suggested**, or **Human-entered**, with the exception taxonomy (Missing / Conflict / Low Confidence / Incomplete) made explicit. Planners resolve exceptions with a note before a package can be approved and released.
- **New Package** — pick a project and package type, and watch the six-stage pipeline (Gather → Normalize → Determine Requirements → Pre-Populate → Validate → Flag) generate a fresh draft.

No package can be approved with open exceptions, and there's no autonomous release — a human always approves and releases.

## Run it

```bash
npm install
npm run seed   # regenerates the synthetic dataset deterministically
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Stack

Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui + Recharts + `next-themes` (dark/light). No backend — all data is a committed, seeded synthetic dataset in `data/`, and interactive state (resolved exceptions, approvals, newly generated packages) is held in the browser's `localStorage`.
