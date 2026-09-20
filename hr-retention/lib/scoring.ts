import {
  FACTOR_KEYS,
  type AggregationDimension,
  type Employee,
  type FactorContribution,
  type FactorKey,
  type GroupRisk,
  type RiskTier,
  type Suggestion,
} from "@/lib/types";
import { clamp, gaussian, type Rng } from "@/lib/random";

/**
 * This is a transparent, hand-specified scoring heuristic — NOT a trained
 * ML model. Every term below is a documented, deterministic function of a
 * feature, so a reviewer can hand-verify any employee's or group's score.
 * The point of this prototype is the workflow and UX, not model accuracy.
 */

export interface RawFeatures {
  compRatio: number;
  engagementScore: number;
  utilizationPct: number;
  managerSpan: number;
  tenureMonths: number;
  recentPromotion: boolean;
  performanceRating: 1 | 2 | 3 | 4 | 5;
  commuteMinutes: number;
}

export function riskTierFor(score: number): RiskTier {
  if (score >= 75) return "Critical";
  if (score >= 55) return "Elevated";
  if (score >= 35) return "Moderate";
  return "Low";
}

export const RISK_TIER_ORDER: Record<RiskTier, number> = {
  Low: 0,
  Moderate: 1,
  Elevated: 2,
  Critical: 3,
};

export function utilizationLabelFor(over: number, under: number): string {
  return over >= under && over > 0 ? "Sustained overwork" : under > 0 ? "Underutilization risk" : "Workload within range";
}

export function tenureLabelFor(newHire: number, plateau: number): string {
  return newHire >= plateau && newHire > 0
    ? "New-hire ramp-up risk"
    : plateau > 0
      ? "Career plateau (no recent growth)"
      : "Tenure within normal range";
}

function computeFactors(f: RawFeatures): FactorContribution[] {
  const compensation = Math.max(0, 1 - f.compRatio) * 120 - Math.max(0, f.compRatio - 1.05) * 20;

  const engagement = (62 - f.engagementScore) * 0.8;

  const over = Math.max(0, f.utilizationPct - 100);
  const under = Math.max(0, 70 - f.utilizationPct);
  const utilization = over * 0.6 + under * 0.45;
  const utilizationLabel = utilizationLabelFor(over, under);

  const managerSpan = Math.max(0, f.managerSpan - 8) * 1.3;

  const newHire = f.tenureMonths < 9 ? (9 - f.tenureMonths) * 1.3 : 0;
  const plateau = f.tenureMonths > 48 && !f.recentPromotion ? Math.min(f.tenureMonths - 48, 60) * 0.25 : 0;
  const tenure = newHire + plateau;
  const tenureLabel = tenureLabelFor(newHire, plateau);

  const promotion = !f.recentPromotion && f.tenureMonths > 24 ? 8 : f.recentPromotion ? -6 : 0;

  const performance =
    f.performanceRating >= 4
      ? Math.max(0, 1 - f.compRatio) * 55 + Math.max(0, 62 - f.engagementScore) * 0.35
      : 0;

  const commute = Math.max(0, f.commuteMinutes - 35) * 0.22;

  const items: FactorContribution[] = [
    { key: "compensation", label: "Below-market compensation", contribution: compensation },
    { key: "engagement", label: "Weak engagement signal", contribution: engagement },
    { key: "utilization", label: utilizationLabel, contribution: utilization },
    { key: "managerSpan", label: "Thin manager attention (wide span of control)", contribution: managerSpan },
    { key: "tenure", label: tenureLabel, contribution: tenure },
    { key: "promotion", label: "No recent promotion or growth signal", contribution: promotion },
    { key: "performance", label: "High-performer flight risk", contribution: performance },
    { key: "commute", label: "Long commute burden", contribution: commute },
  ];

  return items;
}

export function computeEmployeeRisk(
  f: RawFeatures,
  rng: Rng
): { riskScore: number; riskTier: RiskTier; factors: FactorContribution[] } {
  const factors = computeFactors(f);
  const linear = factors.reduce((sum, item) => sum + item.contribution, 0);
  const noise = gaussian(rng, 0, 4);
  const riskScore = clamp(Math.round(18 + linear + noise), 2, 98);
  return { riskScore, riskTier: riskTierFor(riskScore), factors };
}

export function topFactors(factors: FactorContribution[], n = 3): FactorContribution[] {
  return [...factors]
    .filter((f) => f.contribution > 1)
    .sort((a, b) => b.contribution - a.contribution)
    .slice(0, n);
}

// ---- Aggregation ------------------------------------------------------

function groupKeyAndLabel(e: Employee, dimension: AggregationDimension): { key: string; label: string; parts: string[] } {
  switch (dimension) {
    case "department":
      return { key: e.department, label: e.department, parts: [e.department] };
    case "location":
      return { key: e.location, label: e.location, parts: [e.location] };
    case "department-location":
      return {
        key: `${e.department}__${e.location}`,
        label: `${e.department} — ${e.location}`,
        parts: [e.department, e.location],
      };
    case "jobRole":
      return { key: e.jobRole, label: e.jobRole, parts: [e.jobRole] };
  }
}

function buildSuggestions(members: Employee[], avgFactors: FactorContribution[]): Suggestion[] {
  const n = members.length;
  const avgUtilization = members.reduce((s, e) => s + e.utilizationPct, 0) / n;
  const avgTenure = members.reduce((s, e) => s + e.tenureMonths, 0) / n;
  const promotionRate = members.filter((e) => e.recentPromotion).length / n;

  const copy: Record<FactorKey, string> = {
    compensation: "Review compensation bands against market benchmarks for this group.",
    engagement: "Run a pulse survey or stay interviews to diagnose the engagement drop.",
    utilization:
      avgUtilization >= 100
        ? "Rebalance workload across the team — sustained overwork is elevated here."
        : "Reassess role scope; utilization is unusually low for this group.",
    managerSpan: "Add a team-lead layer; span of control is unusually wide for this group.",
    tenure:
      avgTenure < 18
        ? "Strengthen new-hire onboarding and structured 90-day check-ins."
        : "Refresh career pathing — many tenured employees show plateau risk.",
    promotion: `Revisit promotion and growth pathways (only ${Math.round(promotionRate * 100)}% saw a recent promotion).`,
    performance: "Prioritize retention conversations with top performers showing risk signals.",
    commute: "Explore flexible or hybrid work arrangements to offset commute burden.",
  };

  return topFactors(avgFactors, 3).map((f) => ({
    id: `${f.key}`,
    text: copy[f.key],
    basedOn: f.key,
  }));
}

export function aggregateGroups(employees: Employee[], dimension: AggregationDimension): GroupRisk[] {
  const buckets = new Map<string, { label: string; parts: string[]; members: Employee[] }>();

  for (const e of employees) {
    const { key, label, parts } = groupKeyAndLabel(e, dimension);
    if (!buckets.has(key)) buckets.set(key, { label, parts, members: [] });
    buckets.get(key)!.members.push(e);
  }

  const groups: GroupRisk[] = [];
  for (const [key, { label, parts, members }] of buckets) {
    if (members.length < 3) continue; // too small to report as a group without deanonymizing individuals

    const avgRisk = Math.round(members.reduce((s, e) => s + e.riskScore, 0) / members.length);

    // Static labels can be copied from any member. Utilization and tenure
    // labels are direction-dependent (over- vs under-utilized, new-hire vs
    // plateau). They must be picked from the MEAN OF EACH MEMBER'S OWN
    // over/under (or newHire/plateau) term — the same quantity the
    // contribution average above uses — not from the group's averaged raw
    // utilization/tenure. Because max(0, x) is nonlinear, deriving over/under
    // from the averaged input can wash out a real mixed signal (half the
    // group badly overworked, half badly underworked nets out to "normal"
    // utilization even though both halves are a genuine problem).
    const avgOver = members.reduce((s, e) => s + Math.max(0, e.utilizationPct - 100), 0) / members.length;
    const avgUnder = members.reduce((s, e) => s + Math.max(0, 70 - e.utilizationPct), 0) / members.length;
    const utilizationGroupLabel = utilizationLabelFor(avgOver, avgUnder);

    const avgNewHire = members.reduce((s, e) => s + (e.tenureMonths < 9 ? 9 - e.tenureMonths : 0), 0) / members.length;
    const avgPlateau =
      members.reduce(
        (s, e) => s + (e.tenureMonths > 48 && !e.recentPromotion ? Math.min(e.tenureMonths - 48, 60) : 0),
        0
      ) / members.length;
    const tenureGroupLabel = tenureLabelFor(avgNewHire, avgPlateau);

    const labelOverrides: Partial<Record<FactorKey, string>> = {
      utilization: utilizationGroupLabel,
      tenure: tenureGroupLabel,
    };

    const avgFactors: FactorContribution[] = FACTOR_KEYS.map((k: FactorKey) => {
      const match = members[0].factors.find((f) => f.key === k)!;
      const avgContribution =
        members.reduce((s, e) => s + (e.factors.find((f) => f.key === k)?.contribution ?? 0), 0) / members.length;
      return { key: k, label: labelOverrides[k] ?? match.label, contribution: avgContribution };
    });

    const quarters = members[0].riskHistory.map((q) => q.quarter);
    const trend = quarters.map((quarter) => ({
      quarter,
      risk: Math.round(
        members.reduce((s, e) => s + (e.riskHistory.find((q) => q.quarter === quarter)?.risk ?? e.riskScore), 0) /
          members.length
      ),
    }));

    groups.push({
      id: `${dimension}:${key}`,
      dimension,
      label,
      dimensionParts: parts,
      headcount: members.length,
      avgRisk,
      riskTier: riskTierFor(avgRisk),
      topFactors: topFactors(avgFactors, 3),
      trend,
      suggestions: buildSuggestions(members, avgFactors),
      memberIds: members.map((e) => e.id),
    });
  }

  return groups.sort((a, b) => b.avgRisk - a.avgRisk);
}
