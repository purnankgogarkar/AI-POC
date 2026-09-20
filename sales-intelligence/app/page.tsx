import { getAccounts, getAccountSummaries, getDashboardKpis, getOpportunities } from "@/lib/data";
import { OverviewClient } from "@/components/overview-client";

export default function OverviewPage() {
  return (
    <OverviewClient
      accountSummaries={getAccountSummaries()}
      opportunities={getOpportunities()}
      accounts={getAccounts()}
      kpis={getDashboardKpis()}
    />
  );
}
