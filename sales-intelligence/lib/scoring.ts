import {
  FACTOR_KEYS,
  STAGES,
  type Account,
  type AccountSummary,
  type FactorContribution,
  type FactorKey,
  type Opportunity,
  type Stage,
  type StallRiskTier,
  type Suggestion,
} from "@/lib/types";
import { clamp, gaussian, type Rng } from "@/lib/random";

/**
 * Transparent, hand-specified heuristics — NOT a trained model. Every term
 * is a documented function of a field on the opportunity, so a reviewer can
 * hand-verify any deal's score. The point of this prototype is the
 * workflow and UX, not model accuracy.
 */

const STAGE_BENCHMARK_DAYS: Record<Stage, number> = {
  Prospecting: 15,
  Qualification: 20,
  Proposal: 20,
  Negotiation: 15,
};

const STAGE_BASE_WIN_PROBABILITY: Record<Stage, number> = {
  Prospecting: 0.12,
  Qualification: 0.32,
  Proposal: 0.55,
  Negotiation: 0.78,
};

export function stallRiskTierFor(score: number): StallRiskTier {
  if (score >= 75) return "Critical";
  if (score >= 55) return "Elevated";
  if (score >= 35) return "Moderate";
  return "Low";
}

export const STALL_RISK_TIER_ORDER: Record<StallRiskTier, number> = {
  Low: 0,
  Moderate: 1,
  Elevated: 2,
  Critical: 3,
};

export interface ScoringInput {
  stage: Stage;
  amount: number;
  daysSinceActivity: number;
  daysInStage: number;
  competitorEngaged: boolean;
  nextStepScheduled: boolean;
  stakeholderCount: number;
  accountWinRate: number;
}

function computeFactors(input: ScoringInput): FactorContribution[] {
  const overrun = Math.max(0, input.daysInStage - STAGE_BENCHMARK_DAYS[input.stage]);

  const inactivity = input.daysSinceActivity * 1.1;
  const stageOverrun = overrun * 0.8;
  const noNextStep = input.nextStepScheduled ? 0 : 15;
  const singleThreaded = input.stakeholderCount <= 1 ? 12 : 0;
  const competitor = input.competitorEngaged ? 10 : 0;

  return [
    { key: "inactivity", label: "No recent activity", contribution: inactivity },
    { key: "stageOverrun", label: "Stuck in current stage longer than typical", contribution: stageOverrun },
    { key: "noNextStep", label: "No next step scheduled", contribution: noNextStep },
    { key: "singleThreaded", label: "Single point of contact only", contribution: singleThreaded },
    { key: "competitor", label: "Competitor actively engaged", contribution: competitor },
  ];
}

export function computeOpportunityScoring(
  input: ScoringInput,
  rng: Rng
): { winProbability: number; stallRisk: number; stallRiskTier: StallRiskTier; priorityScore: number; factors: FactorContribution[] } {
  const factors = computeFactors(input);
  const stallLinear = factors.reduce((s, f) => s + f.contribution, 0);
  const stallRisk = clamp(Math.round(10 + stallLinear + gaussian(rng, 0, 4)), 2, 98);
  const stallRiskTier = stallRiskTierFor(stallRisk);

  const overrun = Math.max(0, input.daysInStage - STAGE_BENCHMARK_DAYS[input.stage]);
  let winProbability = STAGE_BASE_WIN_PROBABILITY[input.stage];
  winProbability += (input.accountWinRate - 0.5) * 0.3;
  winProbability -= input.competitorEngaged ? 0.12 : 0;
  winProbability -= Math.min(0.25, input.daysSinceActivity / 120);
  winProbability -= Math.min(0.15, overrun / 100);
  winProbability += input.nextStepScheduled ? 0.05 : 0;
  winProbability = clamp(Math.round(winProbability * 100) / 100, 0.03, 0.95);

  const expectedValue = input.amount * winProbability;
  const urgencyBonus = stallRisk >= 55 ? input.amount * 0.15 : 0;
  const priorityScore = Math.round(expectedValue + urgencyBonus);

  return { winProbability, stallRisk, stallRiskTier, priorityScore, factors };
}

export function topFactors(factors: FactorContribution[], n = 3): FactorContribution[] {
  return [...factors]
    .filter((f) => f.contribution > 1)
    .sort((a, b) => b.contribution - a.contribution)
    .slice(0, n);
}

const SUGGESTION_COPY: Record<FactorKey, (o: Opportunity) => string> = {
  inactivity: (o) => `Schedule a check-in — no activity in ${daysSince(o.lastActivityDate)} days.`,
  stageOverrun: (o) => `Escalate for internal review — this deal has been in ${o.stage} longer than typical.`,
  noNextStep: () => "Lock in a concrete next step with a calendar date.",
  singleThreaded: () => "Multi-thread the deal — engage a second stakeholder at the account.",
  competitor: () => "Sharpen competitive positioning — a competitor is actively engaged.",
};

// Anchored to the dataset's fixed "today" (matching the other seeded P² apps)
// rather than the real wall clock, so the numbers stay correct no matter when
// this gets viewed.
const DATASET_TODAY = new Date("2026-09-20").getTime();

function daysSince(dateIso: string): number {
  return Math.max(0, Math.round((DATASET_TODAY - new Date(dateIso).getTime()) / (1000 * 60 * 60 * 24)));
}

export function buildSuggestions(o: Opportunity): Suggestion[] {
  return topFactors(o.factors, 2).map((f) => ({
    id: f.key,
    text: SUGGESTION_COPY[f.key](o),
    basedOn: f.key,
  }));
}

export function summarizeAccount(account: Account, opportunities: Opportunity[]): AccountSummary {
  const openOpportunityCount = opportunities.length;
  const totalPipeline = opportunities.reduce((s, o) => s + o.amount, 0);
  const totalPriorityValue = opportunities.reduce((s, o) => s + o.priorityScore, 0);
  const avgStallRisk = openOpportunityCount
    ? Math.round(opportunities.reduce((s, o) => s + o.stallRisk, 0) / openOpportunityCount)
    : 0;

  const avgFactors: FactorContribution[] = FACTOR_KEYS.map((k) => {
    const match = opportunities[0]?.factors.find((f) => f.key === k);
    const avgContribution = openOpportunityCount
      ? opportunities.reduce((s, o) => s + (o.factors.find((f) => f.key === k)?.contribution ?? 0), 0) / openOpportunityCount
      : 0;
    return { key: k, label: match?.label ?? k, contribution: avgContribution };
  });

  const quarters = opportunities[0]?.riskHistory.map((q) => q.label) ?? [];
  const trend = quarters.map((label) => ({
    label,
    value: Math.round(
      opportunities.reduce((s, o) => s + (o.riskHistory.find((q) => q.label === label)?.value ?? o.stallRisk), 0) /
        Math.max(1, openOpportunityCount)
    ),
  }));

  return {
    account,
    openOpportunityCount,
    totalPipeline: Math.round(totalPipeline),
    totalPriorityValue,
    avgStallRisk,
    avgStallRiskTier: stallRiskTierFor(avgStallRisk),
    topFactors: topFactors(avgFactors, 3),
    trend,
  };
}

export { STAGES, STAGE_BENCHMARK_DAYS };
