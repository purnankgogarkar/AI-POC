import accountsJson from "@/data/accounts.json";
import opportunitiesJson from "@/data/opportunities.json";
import { summarizeAccount } from "@/lib/scoring";
import type { Account, AccountSummary, Opportunity } from "@/lib/types";

const accounts = accountsJson as unknown as Account[];
const opportunities = opportunitiesJson as unknown as Opportunity[];

export function getAccounts(): Account[] {
  return accounts;
}

export function getOpportunities(): Opportunity[] {
  return opportunities;
}

export function getAccountById(id: string): Account | undefined {
  return accounts.find((a) => a.id === id);
}

export function getOpportunityById(id: string): Opportunity | undefined {
  return opportunities.find((o) => o.id === id);
}

export function getOpportunitiesForAccount(accountId: string): Opportunity[] {
  return opportunities.filter((o) => o.accountId === accountId);
}

let accountSummaryCache: AccountSummary[] | null = null;

export function getAccountSummaries(): AccountSummary[] {
  if (!accountSummaryCache) {
    accountSummaryCache = accounts.map((a) => summarizeAccount(a, getOpportunitiesForAccount(a.id)));
  }
  return accountSummaryCache;
}

export function getAccountSummaryById(id: string): AccountSummary | undefined {
  return getAccountSummaries().find((s) => s.account.id === id);
}

export function getDashboardKpis() {
  const totalPipeline = opportunities.reduce((s, o) => s + o.amount, 0);
  const weightedPipeline = opportunities.reduce((s, o) => s + o.amount * o.winProbability, 0);
  const highStallRisk = opportunities.filter((o) => o.stallRisk >= 55).length;
  const avgCycleDays = Math.round(
    opportunities.reduce((s, o) => s + Math.round((new Date(o.expectedCloseDate).getTime() - new Date(o.createdAt).getTime()) / 86400000), 0) /
      opportunities.length
  );

  return {
    opportunityCount: opportunities.length,
    accountCount: accounts.length,
    totalPipeline: Math.round(totalPipeline),
    weightedPipeline: Math.round(weightedPipeline),
    highStallRisk,
    avgCycleDays,
  };
}
