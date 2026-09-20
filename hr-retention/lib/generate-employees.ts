import { mulberry32, pick, weightedPick, chance, gaussian, clamp, round, type Rng } from "@/lib/random";
import { computeEmployeeRisk } from "@/lib/scoring";
import {
  DEPARTMENTS,
  LOCATIONS,
  AGE_BANDS,
  type Department,
  type Employee,
} from "@/lib/types";

const ROLES_BY_DEPARTMENT: Record<Department, string[]> = {
  Fabrication: ["Fabricator", "Welder", "Shop Supervisor"],
  "Field Operations": ["Field Technician", "Site Superintendent", "Equipment Operator"],
  "Project Management": ["Project Manager", "Project Coordinator"],
  Engineering: ["Design Engineer", "Detailer"],
  "Finance & Accounting": ["AP Specialist", "Financial Analyst"],
  "Human Resources": ["HR Business Partner", "Recruiter"],
  "IT & Systems": ["Systems Analyst", "IT Support Specialist"],
  "Quality & Safety": ["QA Inspector", "Safety Coordinator"],
  "Supply Chain": ["Buyer", "Materials Planner"],
  "Sales & Estimating": ["Estimator", "Account Manager"],
};

const LOCATION_WEIGHTS: readonly (readonly [typeof LOCATIONS[number], number])[] = [
  ["Denver, CO", 30],
  ["Houston, TX", 25],
  ["Charlotte, NC", 15],
  ["Phoenix, AZ", 15],
  ["Columbus, OH", 15],
];

const FIRST_NAMES = [
  "James", "Maria", "Robert", "Linda", "Michael", "Patricia", "David", "Jennifer",
  "William", "Elizabeth", "Carlos", "Susan", "Joseph", "Jessica", "Daniel", "Sarah",
  "Anthony", "Karen", "Mark", "Nancy", "Kevin", "Lisa", "Brian", "Betty", "George",
  "Sandra", "Edward", "Ashley", "Ronald", "Emily", "Steven", "Michelle", "Jason",
  "Amanda", "Andrew", "Melissa", "Paul", "Deborah", "Joshua", "Stephanie", "Luis",
  "Rebecca", "Eric", "Laura", "Terry", "Cynthia", "Raymond", "Kathleen", "Gregory", "Amy",
] as const;

const LAST_NAMES = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
  "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson",
  "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson",
  "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson", "Walker",
  "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores",
] as const;

const QUARTER_LABELS = ["2025 Q3", "2025 Q4", "2026 Q1", "2026 Q2", "2026 Q3"] as const;

/**
 * A handful of deliberately "stressed" department+location combinations —
 * e.g. a site running hot on overtime, a corridor with a known pay gap.
 * Without this, independent random draws rarely stack badly enough on the
 * SAME group to clear the Elevated/Critical thresholds once averaged, which
 * is realistic but makes for a flat demo. This nudges a few specific groups
 * into visibly elevated territory while leaving the rest of the population
 * to fall out organically from the base distribution.
 */
const HOTSPOTS: Record<string, { compRatioDelta?: number; engagementDelta?: number; utilizationDelta?: number; commuteDelta?: number; promotionMultiplier?: number }> = {
  "Fabrication|Phoenix, AZ": { compRatioDelta: -0.1, utilizationDelta: 24, engagementDelta: -12 },
  "Field Operations|Houston, TX": { compRatioDelta: -0.08, engagementDelta: -16, commuteDelta: 20, promotionMultiplier: 0.4 },
  "Quality & Safety|Phoenix, AZ": { compRatioDelta: -0.09, engagementDelta: -14, promotionMultiplier: 0.5 },
  "Sales & Estimating|Denver, CO": { compRatioDelta: -0.06, engagementDelta: -8, utilizationDelta: 14 },
};

const PERFORMANCE_WEIGHTS: readonly (readonly [1 | 2 | 3 | 4 | 5, number])[] = [
  [1, 5],
  [2, 15],
  [3, 40],
  [4, 30],
  [5, 10],
];

const AGE_BAND_WEIGHTS: readonly (readonly [typeof AGE_BANDS[number], number])[] = [
  ["20-29", 22],
  ["30-39", 28],
  ["40-49", 24],
  ["50-59", 18],
  ["60+", 8],
];

function buildRiskHistory(rng: Rng, currentRisk: number) {
  const scores = new Array<number>(QUARTER_LABELS.length);
  scores[scores.length - 1] = currentRisk;
  for (let i = scores.length - 2; i >= 0; i--) {
    const next = scores[i + 1];
    scores[i] = clamp(Math.round(next + gaussian(rng, 0, 4) - 0.15 * (next - 50)), 2, 98);
  }
  return QUARTER_LABELS.map((quarter, i) => ({ quarter, risk: scores[i] }));
}

export function generateEmployees(count: number, seed: number): Employee[] {
  const rng = mulberry32(seed);
  const employees: Employee[] = [];

  for (let i = 0; i < count; i++) {
    const id = `E${String(i + 1).padStart(4, "0")}`;
    const department = pick(rng, DEPARTMENTS);
    const roles = ROLES_BY_DEPARTMENT[department];
    const jobRole = pick(rng, roles);
    const location = weightedPick(rng, LOCATION_WEIGHTS);
    const hotspot = HOTSPOTS[`${department}|${location}`];

    const tenureMonths = clamp(Math.round(gaussian(rng, 34, 30)), 1, 220);
    const compRatio = round(
      clamp(gaussian(rng, 1.0 + (hotspot?.compRatioDelta ?? 0), 0.12), 0.6, 1.28),
      2
    );
    const performanceRating = weightedPick(rng, PERFORMANCE_WEIGHTS);

    // Correlated, not independent: underpaid people tend to also be less
    // engaged, and top performers tend to be worked harder — small, realistic
    // couplings that produce fatter joint risk tails than pure independence would.
    const engagementScore = clamp(
      Math.round(
        gaussian(rng, 68 + (hotspot?.engagementDelta ?? 0) - Math.max(0, 1 - compRatio) * 55, 16)
      ),
      8,
      98
    );
    const utilizationPct = clamp(
      Math.round(
        gaussian(rng, 92 + (hotspot?.utilizationDelta ?? 0) + (performanceRating - 3) * 9, 20)
      ),
      40,
      160
    );

    const managerSpan = clamp(Math.round(gaussian(rng, 8, 3.6)), 3, 24);
    const recentPromotion =
      tenureMonths < 12
        ? chance(rng, 0.85)
        : chance(rng, 0.2 * (hotspot?.promotionMultiplier ?? 1));
    const commuteMinutes = clamp(Math.round(gaussian(rng, 28 + (hotspot?.commuteDelta ?? 0), 16)), 5, 105);
    const ageBand = weightedPick(rng, AGE_BAND_WEIGHTS);

    const { riskScore, riskTier, factors } = computeEmployeeRisk(
      {
        compRatio,
        engagementScore,
        utilizationPct,
        managerSpan,
        tenureMonths,
        recentPromotion,
        performanceRating,
        commuteMinutes,
      },
      rng
    );

    employees.push({
      id,
      name: `${pick(rng, FIRST_NAMES)} ${pick(rng, LAST_NAMES)}`,
      department,
      location,
      jobRole,
      tenureMonths,
      ageBand,
      compRatio,
      engagementScore,
      utilizationPct,
      managerSpan,
      recentPromotion,
      performanceRating,
      commuteMinutes,
      riskScore,
      riskTier,
      factors,
      riskHistory: buildRiskHistory(rng, riskScore),
    });
  }

  return employees;
}

export { QUARTER_LABELS };
