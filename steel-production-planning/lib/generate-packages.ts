import { mulberry32, pick, weightedPick, chance, gaussian, randInt, clamp, round, type Rng } from "@/lib/random";
import { REQUIREMENT_CATALOG } from "@/lib/requirements-catalog";
import type { FieldStatus, PackageEvent, PackageInstance, PackageStatus, RequirementItem } from "@/lib/types";
import { PACKAGE_TYPES } from "@/lib/types";

const PROJECTS = [
  "Riverside Distribution Center", "Harbor Point Logistics Hub", "Meridian Business Park",
  "Northgate Industrial Campus", "Cedar Creek Manufacturing Facility", "Summit Ridge Warehouse",
  "Lakeview Cold Storage Facility", "Union Yard Fulfillment Center", "Prairie Crossing Plant Expansion",
  "Ironwood Fabrication Annex",
] as const;

const PHASES = ["Phase 1 — Foundations", "Phase 2 — Structural Steel", "Phase 3 — Enclosure", "Phase 4 — Finishes"] as const;

const PLANNERS = ["Dana Whitfield", "Marcus Ibe", "Priya Raman", "Tom Halversen", "Elena Cruz", "Sam O'Brien"] as const;

function generateRequirements(rng: Rng): {
  requirements: RequirementItem[];
  originalExceptionCount: number;
  requiredExceptionCount: number;
} {
  const requirements: RequirementItem[] = [];
  let originalExceptionCount = 0;
  let requiredExceptionCount = 0;

  for (const tmpl of REQUIREMENT_CATALOG) {
    const applicable = tmpl.required || chance(rng, 0.55);
    if (!applicable) continue;

    const confidence = round(clamp(gaussian(rng, tmpl.defaultSource === "AI" ? 0.93 : 0.97, 0.08), 0.4, 0.99), 2);

    let status: FieldStatus;
    const source = tmpl.defaultSource;
    let conflictValues: [string, string] | undefined;

    if (tmpl.defaultSource === "Human" && chance(rng, 0.08)) {
      status = "Missing"; // nobody's entered it yet
    } else if (confidence < 0.72) {
      status = "Low Confidence";
    } else if (chance(rng, 0.02)) {
      status = "Conflict";
      conflictValues = ["From drawing set", "From BOM export"];
    } else if (chance(rng, 0.015)) {
      status = "Incomplete";
    } else if (chance(rng, 0.015)) {
      status = "Missing";
    } else {
      status = "Populated";
    }

    if (status !== "Populated") {
      originalExceptionCount++;
      if (tmpl.required) requiredExceptionCount++;
    }

    requirements.push({
      id: `${tmpl.id}`,
      name: tmpl.name,
      required: tmpl.required,
      sourceSystem: tmpl.sourceSystem,
      status,
      source,
      confidence,
      value: status === "Populated" ? "Populated from source" : undefined,
      conflictValues,
    });
  }

  return { requirements, originalExceptionCount, requiredExceptionCount };
}

const STATUS_WEIGHTS: readonly (readonly [PackageStatus, number])[] = [
  ["Released", 50],
  ["Approved", 12],
  ["Needs Review", 20],
  ["Draft Generated", 18],
];

function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function randomPastDate(rng: Rng, daysBack: number): string {
  const end = new Date("2026-09-20").getTime();
  const t = end - rng() * daysBack * 24 * 60 * 60 * 1000;
  return new Date(t).toISOString().slice(0, 10);
}

export function generatePackages(count: number, seed: number): PackageInstance[] {
  const rng = mulberry32(seed);
  const packages: PackageInstance[] = [];

  for (let i = 0; i < count; i++) {
    const project = pick(rng, PROJECTS);
    const jobNumber = randInt(rng, 1000, 1099);
    const phase = pick(rng, PHASES);
    const release = `Release ${randInt(rng, 1, 3)}`;
    const packageType = pick(rng, PACKAGE_TYPES);
    const planner = pick(rng, PLANNERS);

    const requestedAt = randomPastDate(rng, 150);
    const leadDays = randInt(rng, 10, 25);
    const requiredByDate = addDays(requestedAt, leadDays);

    const status = weightedPick(rng, STATUS_WEIGHTS);

    const { requirements, originalExceptionCount, requiredExceptionCount } = generateRequirements(rng);
    const firstPassComplete = requiredExceptionCount === 0;

    const history: PackageEvent[] = [
      { timestamp: requestedAt, event: "Draft package generated (rules + AI pre-population)", actor: "System" },
    ];

    let correctionsCount = 0;
    let releasedAt: string | null = null;

    if (status === "Needs Review" || status === "Draft Generated") {
      if (originalExceptionCount > 0) {
        history.push({
          timestamp: requestedAt,
          event: `${originalExceptionCount} exception${originalExceptionCount === 1 ? "" : "s"} flagged for planner review`,
          actor: "System",
        });
      }
    }

    if (status === "Approved" || status === "Released") {
      // Can't approve with open exceptions — the planner resolves them first.
      for (const r of requirements) {
        if (r.status !== "Populated") {
          r.status = "Populated";
          r.source = "Human";
          r.value = "Corrected by planner";
          r.note = "Resolved during review";
          correctionsCount++;
        }
      }
      if (correctionsCount > 0) {
        history.push({
          timestamp: addDays(requestedAt, 1),
          event: `${correctionsCount} correction${correctionsCount === 1 ? "" : "s"} made by planner`,
          actor: planner,
        });
      }
      history.push({ timestamp: addDays(requestedAt, 2), event: "Package approved", actor: planner });
    }

    if (status === "Released") {
      const cycleDays = clamp(Math.round(gaussian(rng, leadDays, 6)), 3, 60);
      releasedAt = addDays(requestedAt, cycleDays);
      history.push({ timestamp: releasedAt, event: "Package released to shop", actor: planner });
    }

    const effortHours = round(clamp(3 + originalExceptionCount * 0.7 + gaussian(rng, 0, 1.2), 1.5, 16), 1);
    const downstreamIssues = Math.max(0, Math.round(gaussian(rng, originalExceptionCount * 0.18, 0.6)));

    packages.push({
      id: `PKG${String(i + 1).padStart(4, "0")}`,
      project,
      job: `J-${jobNumber}`,
      phase,
      release,
      packageType,
      status,
      planner,
      requestedAt,
      requiredByDate,
      releasedAt,
      effortHours,
      correctionsCount,
      downstreamIssues: status === "Released" ? downstreamIssues : 0,
      firstPassComplete,
      originalExceptionCount,
      requirements,
      history,
    });
  }

  return packages.sort((a, b) => (a.requestedAt < b.requestedAt ? 1 : -1));
}

/** Used by the "New Package" flow: always a fresh Draft Generated package, requested today. */
export function generateNewDraftPackage(
  project: string,
  packageType: (typeof PACKAGE_TYPES)[number],
  seed: number
): PackageInstance {
  const rng = mulberry32(seed);
  const jobNumber = randInt(rng, 1000, 1099);
  const phase = pick(rng, PHASES);
  const release = `Release ${randInt(rng, 1, 3)}`;
  const planner = pick(rng, PLANNERS);

  const requestedAt = new Date().toISOString().slice(0, 10);
  const leadDays = randInt(rng, 10, 25);
  const requiredByDate = addDays(requestedAt, leadDays);

  const { requirements, originalExceptionCount, requiredExceptionCount } = generateRequirements(rng);
  const firstPassComplete = requiredExceptionCount === 0;

  const history: PackageEvent[] = [
    { timestamp: requestedAt, event: "Draft package generated (rules + AI pre-population)", actor: "System" },
  ];
  if (originalExceptionCount > 0) {
    history.push({
      timestamp: requestedAt,
      event: `${originalExceptionCount} exception${originalExceptionCount === 1 ? "" : "s"} flagged for planner review`,
      actor: "System",
    });
  }

  const effortHours = round(clamp(3 + originalExceptionCount * 0.7 + gaussian(rng, 0, 1.2), 1.5, 16), 1);

  return {
    id: `PKG-NEW-${Date.now().toString(36).toUpperCase()}`,
    project,
    job: `J-${jobNumber}`,
    phase,
    release,
    packageType,
    status: originalExceptionCount > 0 ? "Needs Review" : "Draft Generated",
    planner,
    requestedAt,
    requiredByDate,
    releasedAt: null,
    effortHours,
    correctionsCount: 0,
    downstreamIssues: 0,
    firstPassComplete,
    originalExceptionCount,
    requirements,
    history,
  };
}

export { PROJECTS, PLANNERS };
