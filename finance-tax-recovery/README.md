# P² Verify — Invoice Tax Validation & Recovery

Part of the [P² Suite](../README.md). A working prototype that extracts invoice line items, determines the correct sales tax by jurisdiction, compares it against what was applied, and flags both **recovery opportunities** (overpaid) and **audit exposure** (underpaid) — on synthesized invoices for a single MVP jurisdiction (Denver, CO).

## What it does

- **Dashboard** — recovery opportunity vs. audit exposure by month, status breakdown, top candidates on each side.
- **Invoices** — a searchable, filterable, paginated list of processed invoices.
- **Invoice detail** — per-line comparison of applied vs. expected tax, with the jurisdiction rate citation for every figure, and confidence/ambiguity flags routed to "Needs Review" instead of being silently resolved.
- **Upload flow** — a simulated document-intelligence pipeline (Extract → Resolve Jurisdiction → Classify → Compare → Flag). It does not run real OCR; it demonstrates the workflow and produces a new synthesized result.

Every result cites the rule and rate that produced it — nothing here posts or corrects any AP record automatically.

## Run it

```bash
npm install
npm run seed   # regenerates the synthetic dataset deterministically
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Stack

Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui + Recharts + `next-themes` (dark/light). No backend — all data is a committed, seeded synthetic dataset in `data/`, and anything "uploaded" through the demo flow is held in the browser's `localStorage`.
