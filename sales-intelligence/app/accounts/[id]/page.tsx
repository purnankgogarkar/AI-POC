import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getAccountSummaryById, getOpportunitiesForAccount } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StallRiskBadge } from "@/components/stall-risk-badge";
import { TrendSparkline } from "@/components/trend-sparkline";
import { FactorBarChart } from "@/components/factor-bar-chart";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AccountOpportunityRow } from "@/components/account-opportunity-row";

const currency = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export default async function AccountDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const summary = getAccountSummaryById(id);
  if (!summary) notFound();

  const opportunities = getOpportunitiesForAccount(id).sort((a, b) => b.priorityScore - a.priorityScore);

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to overview
      </Link>

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{summary.account.name}</h1>
            <StallRiskBadge tier={summary.avgStallRiskTier} />
          </div>
          <div className="text-sm text-muted-foreground">
            {summary.account.city}, {summary.account.country} · {summary.account.tier} · {summary.account.segment} ·{" "}
            {summary.account.relationshipMonths}mo relationship · {Math.round(summary.account.historicalWinRate * 100)}%
            historical win rate
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg. stall risk trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-3 text-3xl font-semibold tabular-nums">{summary.avgStallRisk}</div>
            <TrendSparkline data={summary.trend} height={110} metricLabel="Avg. stall risk" domain={[0, 100]} />
            <div className="mt-2 flex justify-between text-xs text-muted-foreground">
              {summary.trend.map((t) => (
                <span key={t.label}>{t.label}</span>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Driver factors across this account&apos;s pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <FactorBarChart factors={summary.topFactors} height={160} />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="py-4">
          <CardContent className="px-4">
            <div className="text-xs text-muted-foreground">Open opportunities</div>
            <div className="text-xl font-semibold tabular-nums">{summary.openOpportunityCount}</div>
          </CardContent>
        </Card>
        <Card className="py-4">
          <CardContent className="px-4">
            <div className="text-xs text-muted-foreground">Open pipeline</div>
            <div className="text-xl font-semibold tabular-nums">{currency(summary.totalPipeline)}</div>
          </CardContent>
        </Card>
        <Card className="py-4">
          <CardContent className="px-4">
            <div className="text-xs text-muted-foreground">Priority value</div>
            <div className="text-xl font-semibold tabular-nums">{currency(summary.totalPriorityValue)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Open opportunities at this account</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead>Category</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Win prob.</TableHead>
                <TableHead>Stall risk</TableHead>
                <TableHead className="text-right">Priority</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {opportunities.map((o) => (
                <AccountOpportunityRow key={o.id} opportunity={o} />
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
