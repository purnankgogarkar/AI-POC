export const REGION = "APAC" as const;

export const COUNTRIES = ["India", "China", "Japan", "Australia", "Singapore", "Indonesia"] as const;
export type Country = (typeof COUNTRIES)[number];

export const CITIES_BY_COUNTRY: Record<Country, readonly string[]> = {
  India: ["Mumbai", "Delhi", "Bengaluru"],
  China: ["Shanghai", "Beijing", "Shenzhen"],
  Japan: ["Tokyo", "Osaka"],
  Australia: ["Sydney", "Melbourne"],
  Singapore: ["Singapore"],
  Indonesia: ["Jakarta", "Surabaya"],
};

export const ACCOUNT_TIERS = ["Enterprise", "Mid-Market", "SMB"] as const;
export type AccountTier = (typeof ACCOUNT_TIERS)[number];

export const ACCOUNT_SEGMENTS = [
  "Regional Distributor",
  "Retail Chain",
  "Online Marketplace Partner",
  "Specialty Retailer",
] as const;
export type AccountSegment = (typeof ACCOUNT_SEGMENTS)[number];

export const PRODUCT_CATEGORIES = [
  "Mobile Accessories",
  "Home Appliances",
  "Personal Audio",
  "Wearables",
  "Smart Home",
] as const;
export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export const STAGES = ["Prospecting", "Qualification", "Proposal", "Negotiation"] as const;
export type Stage = (typeof STAGES)[number];

export const STALL_RISK_TIERS = ["Low", "Moderate", "Elevated", "Critical"] as const;
export type StallRiskTier = (typeof STALL_RISK_TIERS)[number];

export const FACTOR_KEYS = ["inactivity", "stageOverrun", "noNextStep", "singleThreaded", "competitor"] as const;
export type FactorKey = (typeof FACTOR_KEYS)[number];

export interface FactorContribution {
  key: FactorKey;
  label: string;
  contribution: number;
}

export interface TrendPoint {
  label: string;
  value: number;
}

export interface Account {
  id: string;
  name: string;
  country: Country;
  city: string;
  tier: AccountTier;
  segment: AccountSegment;
  relationshipMonths: number;
  historicalWinRate: number;
}

export interface Suggestion {
  id: string;
  text: string;
  basedOn: FactorKey;
}

export interface Opportunity {
  id: string;
  accountId: string;
  productCategory: ProductCategory;
  stage: Stage;
  amount: number;
  createdAt: string;
  expectedCloseDate: string;
  stageEnteredAt: string;
  lastActivityDate: string;
  assignedRep: string;
  competitorEngaged: boolean;
  nextStepScheduled: boolean;
  stakeholderCount: number;
  winProbability: number;
  stallRisk: number;
  stallRiskTier: StallRiskTier;
  priorityScore: number;
  factors: FactorContribution[];
  suggestions: Suggestion[];
  riskHistory: TrendPoint[];
}

/** Per-account roll-up of its own open opportunities — accounts are already a small,
 *  named list (unlike HR's employees), so there's no need to group multiple
 *  accounts together the way HR groups employees into departments. */
export interface AccountSummary {
  account: Account;
  openOpportunityCount: number;
  totalPipeline: number;
  totalPriorityValue: number;
  avgStallRisk: number;
  avgStallRiskTier: StallRiskTier;
  topFactors: FactorContribution[];
  trend: TrendPoint[];
}
