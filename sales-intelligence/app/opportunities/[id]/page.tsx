import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Lightbulb } from "lucide-react";
import { getAccountById, getOpportunityById } from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StallRiskBadge } from "@/components/stall-risk-badge";
import { TrendSparkline } from "@/components/trend-sparkline";
import { FactorBarChart } from "@/components/factor-bar-chart";

const currency = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm font-medium tabular-nums">{value}</div>
    </div>
  );
}

export default async function OpportunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const opportunity = getOpportunityById(id);
  if (!opportunity) notFound();
  const account = getAccountById(opportunity.accountId);

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to overview
      </Link>

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              {opportunity.productCategory} —{" "}
              {account ? (
                <Link href={`/accounts/${account.id}`} className="text-primary hover:underline">
                  {account.name}
                </Link>
              ) : (
                opportunity.accountId
              )}
            </h1>
            <StallRiskBadge tier={opportunity.stallRiskTier} />
          </div>
          <div className="text-sm text-muted-foreground">
            {opportunity.stage} · {account?.city}, {account?.country} · Rep: {opportunity.assignedRep}
          </div>
        </div>
        <div className="flex gap-4 text-right">
          <div>
            <div className="text-xs text-muted-foreground">Deal amount</div>
            <div className="text-xl font-semibold tabular-nums">{currency(opportunity.amount)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Priority value</div>
            <div className="text-xl font-semibold text-primary tabular-nums">{currency(opportunity.priorityScore)}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Stall risk trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-3 text-3xl font-semibold tabular-nums">{opportunity.stallRisk}</div>
            <TrendSparkline data={opportunity.riskHistory} height={110} metricLabel="Stall risk" domain={[0, 100]} />
            <div className="mt-2 flex justify-between text-xs text-muted-foreground">
              {opportunity.riskHistory.map((t) => (
                <span key={t.label}>{t.label}</span>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">What&apos;s driving this score</CardTitle>
          </CardHeader>
          <CardContent>
            <FactorBarChart factors={opportunity.factors} height={190} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Lightbulb className="size-4 text-primary" /> Recommended next actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {opportunity.suggestions.length > 0 ? (
            <ul className="space-y-3">
              {opportunity.suggestions.map((s) => (
                <li key={s.id} className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-3 text-sm">
                  <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-primary" />
                  {s.text}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No open flags — this deal is progressing normally.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Deal details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Win probability" value={`${Math.round(opportunity.winProbability * 100)}%`} />
          <Stat label="Created" value={opportunity.createdAt} />
          <Stat label="Expected close" value={opportunity.expectedCloseDate} />
          <Stat label="Entered current stage" value={opportunity.stageEnteredAt} />
          <Stat label="Last activity" value={opportunity.lastActivityDate} />
          <Stat label="Next step scheduled" value={opportunity.nextStepScheduled ? "Yes" : "No"} />
          <Stat label="Stakeholders engaged" value={`${opportunity.stakeholderCount}`} />
          <Stat label="Competitor engaged" value={opportunity.competitorEngaged ? "Yes" : "No"} />
        </CardContent>
      </Card>
    </div>
  );
}
