import {
  mulberry32,
  pick,
  weightedPick,
  chance,
  gaussian,
  randInt,
  clamp,
  round,
  type Rng,
} from "@/lib/random";
import { buildSuggestions, computeOpportunityScoring } from "@/lib/scoring";
import {
  ACCOUNT_SEGMENTS,
  CITIES_BY_COUNTRY,
  PRODUCT_CATEGORIES,
  STAGES,
  type Account,
  type AccountSegment,
  type AccountTier,
  type Country,
  type Opportunity,
  type Stage,
} from "@/lib/types";

const COUNTRY_WEIGHTS: readonly (readonly [Country, number])[] = [
  ["India", 26],
  ["China", 24],
  ["Japan", 16],
  ["Australia", 14],
  ["Singapore", 10],
  ["Indonesia", 10],
];

const TIER_WEIGHTS: readonly (readonly [AccountTier, number])[] = [
  ["Enterprise", 20],
  ["Mid-Market", 45],
  ["SMB", 35],
];

const STAGE_WEIGHTS: readonly (readonly [Stage, number])[] = [
  ["Prospecting", 35],
  ["Qualification", 30],
  ["Proposal", 20],
  ["Negotiation", 15],
];

const STAKEHOLDER_WEIGHTS: readonly (readonly [number, number])[] = [
  [1, 35],
  [2, 35],
  [3, 20],
  [4, 10],
];

const NAME_PREFIXES = [
  "Northstar", "Meridian", "Bluewave", "Silverline", "Crestpoint", "Harborlight", "Summit",
  "Redwood", "Skyline", "Anchor", "Vantage", "Brightpath", "Cornerstone", "Tidewater",
  "Ironbridge", "Solstice", "Highfield", "Westgate", "Pinegrove", "Clearview", "Lighthouse",
  "Everline", "Goldleaf", "Riverside", "Alpine", "Coral Bay", "Amberfield", "Falcon Point",
] as const;

const SUFFIX_BY_SEGMENT: Record<AccountSegment, readonly string[]> = {
  "Regional Distributor": ["Distributors", "Trading Co.", "Supply Group"],
  "Retail Chain": ["Retail Group", "Stores", "Retail Network"],
  "Online Marketplace Partner": ["Marketplace Ventures", "Digital Retail", "eCommerce Group"],
  "Specialty Retailer": ["Specialty Retail", "Boutique Electronics", "Select Stores"],
};

const REPS = [
  "Aisha Rahman", "Kenji Watanabe", "Li Wei", "Ananya Iyer", "Ben Sutherland",
  "Nadia Putri", "Ravi Kapoor", "Grace Tan",
] as const;

const HISTORY_LABELS = ["W-4", "W-3", "W-2", "W-1", "Now"] as const;

function buildStallRiskHistory(rng: Rng, currentRisk: number) {
  const scores = new Array<number>(HISTORY_LABELS.length);
  scores[scores.length - 1] = currentRisk;
  for (let i = scores.length - 2; i >= 0; i--) {
    const next = scores[i + 1];
    scores[i] = clamp(Math.round(next + gaussian(rng, 0, 4) - 0.15 * (next - 40)), 2, 98);
  }
  return HISTORY_LABELS.map((label, i) => ({ label, value: scores[i] }));
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function daysAgo(days: number): string {
  return addDays("2026-09-20", -days);
}

function generateAccount(rng: Rng, index: number): Account {
  const country = weightedPick(rng, COUNTRY_WEIGHTS);
  const city = pick(rng, CITIES_BY_COUNTRY[country]);
  const tier = weightedPick(rng, TIER_WEIGHTS);
  const segment = pick(rng, ACCOUNT_SEGMENTS);
  const name = `${pick(rng, NAME_PREFIXES)} ${pick(rng, SUFFIX_BY_SEGMENT[segment])}`;

  return {
    id: `ACC${String(index + 1).padStart(3, "0")}`,
    name,
    country,
    city,
    tier,
    segment,
    relationshipMonths: clamp(Math.round(gaussian(rng, 30, 20)), 1, 120),
    historicalWinRate: round(clamp(gaussian(rng, 0.45, 0.15), 0.1, 0.85), 2),
  };
}

const TIER_AMOUNT_MEAN: Record<AccountTier, number> = { Enterprise: 85000, "Mid-Market": 32000, SMB: 9000 };
const TIER_AMOUNT_STD: Record<AccountTier, number> = { Enterprise: 40000, "Mid-Market": 15000, SMB: 4000 };

function generateOpportunity(rng: Rng, id: string, account: Account): Opportunity {
  const productCategory = pick(rng, PRODUCT_CATEGORIES);
  const stage = weightedPick(rng, STAGE_WEIGHTS);
  const amount = Math.round(
    clamp(gaussian(rng, TIER_AMOUNT_MEAN[account.tier], TIER_AMOUNT_STD[account.tier]), 1500, 400000)
  );

  const ageDays = randInt(rng, 10, 150);
  const createdAt = daysAgo(ageDays);
  const daysInStage = clamp(Math.round(gaussian(rng, 15, 12)), 0, ageDays);
  const stageEnteredAt = addDays(createdAt, Math.max(0, ageDays - daysInStage));
  const daysSinceActivity = clamp(Math.round(gaussian(rng, 9, 15)), 0, 100);
  const lastActivityDate = daysAgo(daysSinceActivity);
  const expectedCloseDate = addDays(createdAt, randInt(rng, 60, 110));

  const competitorEngaged = chance(rng, 0.3);
  const nextStepScheduled = chance(rng, 0.7);
  const stakeholderCount = weightedPick(rng, STAKEHOLDER_WEIGHTS);
  const assignedRep = pick(rng, REPS);

  const { winProbability, stallRisk, stallRiskTier, priorityScore, factors } = computeOpportunityScoring(
    {
      stage,
      amount,
      daysSinceActivity,
      daysInStage,
      competitorEngaged,
      nextStepScheduled,
      stakeholderCount,
      accountWinRate: account.historicalWinRate,
    },
    rng
  );

  const opportunity: Opportunity = {
    id,
    accountId: account.id,
    productCategory,
    stage,
    amount,
    createdAt,
    expectedCloseDate,
    stageEnteredAt,
    lastActivityDate,
    assignedRep,
    competitorEngaged,
    nextStepScheduled,
    stakeholderCount,
    winProbability,
    stallRisk,
    stallRiskTier,
    priorityScore,
    factors,
    suggestions: [],
    riskHistory: buildStallRiskHistory(rng, stallRisk),
  };

  opportunity.suggestions = buildSuggestions(opportunity);
  return opportunity;
}

export function generateSalesData(accountCount: number, seed: number) {
  const rng = mulberry32(seed);
  const accounts: Account[] = Array.from({ length: accountCount }, (_, i) => generateAccount(rng, i));

  const opportunities: Opportunity[] = [];
  let oppIndex = 0;
  for (const account of accounts) {
    const count = randInt(rng, 2, 7);
    for (let i = 0; i < count; i++) {
      oppIndex++;
      opportunities.push(generateOpportunity(rng, `OPP${String(oppIndex).padStart(4, "0")}`, account));
    }
  }

  return { accounts, opportunities };
}

export { STAGES, REPS };
