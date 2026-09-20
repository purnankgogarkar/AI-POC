export const DEPARTMENTS = [
  "Fabrication",
  "Field Operations",
  "Project Management",
  "Engineering",
  "Finance & Accounting",
  "Human Resources",
  "IT & Systems",
  "Quality & Safety",
  "Supply Chain",
  "Sales & Estimating",
] as const;
export type Department = (typeof DEPARTMENTS)[number];

export const LOCATIONS = [
  "Denver, CO",
  "Houston, TX",
  "Charlotte, NC",
  "Phoenix, AZ",
  "Columbus, OH",
] as const;
export type Location = (typeof LOCATIONS)[number];

export const AGE_BANDS = ["20-29", "30-39", "40-49", "50-59", "60+"] as const;
export type AgeBand = (typeof AGE_BANDS)[number];

export const RISK_TIERS = ["Low", "Moderate", "Elevated", "Critical"] as const;
export type RiskTier = (typeof RISK_TIERS)[number];

export const FACTOR_KEYS = [
  "compensation",
  "engagement",
  "utilization",
  "managerSpan",
  "tenure",
  "promotion",
  "performance",
  "commute",
] as const;
export type FactorKey = (typeof FACTOR_KEYS)[number];

export interface FactorContribution {
  key: FactorKey;
  label: string;
  /** Signed contribution to risk, in the same units as the linear risk score. Positive = increases risk. */
  contribution: number;
}

export interface QuarterRisk {
  quarter: string;
  risk: number;
}

export interface Employee {
  id: string;
  name: string;
  department: Department;
  location: Location;
  jobRole: string;
  tenureMonths: number;
  ageBand: AgeBand;
  compRatio: number;
  engagementScore: number;
  utilizationPct: number;
  managerSpan: number;
  recentPromotion: boolean;
  performanceRating: 1 | 2 | 3 | 4 | 5;
  commuteMinutes: number;
  riskScore: number;
  riskTier: RiskTier;
  factors: FactorContribution[];
  riskHistory: QuarterRisk[];
}

export type AggregationDimension =
  | "department"
  | "location"
  | "department-location"
  | "jobRole";

export interface Suggestion {
  id: string;
  text: string;
  basedOn: FactorKey;
}

export interface GroupRisk {
  id: string;
  dimension: AggregationDimension;
  label: string;
  dimensionParts: string[];
  headcount: number;
  avgRisk: number;
  riskTier: RiskTier;
  topFactors: FactorContribution[];
  trend: QuarterRisk[];
  suggestions: Suggestion[];
  memberIds: string[];
}
