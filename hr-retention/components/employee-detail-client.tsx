"use client";

import Link from "next/link";
import { ArrowLeft, Info } from "lucide-react";
import { RiskTierBadge } from "@/components/risk-tier-badge";
import { TrendSparkline } from "@/components/trend-sparkline";
import { FactorBarChart } from "@/components/factor-bar-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { topFactors } from "@/lib/scoring";
import type { Employee } from "@/lib/types";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm font-medium tabular-nums">{value}</div>
    </div>
  );
}

export function EmployeeDetailClient({ employee: e }: { employee: Employee }) {
  const groupId = `department-location:${e.department}__${e.location}`;

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/employees"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to employee explorer
      </Link>

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{e.name}</h1>
            <RiskTierBadge tier={e.riskTier} />
          </div>
          <div className="text-sm text-muted-foreground">
            {e.jobRole} · {e.department} · {e.location}
          </div>
        </div>
        <Link href={`/groups/${encodeURIComponent(groupId)}`} className="text-sm text-primary hover:underline">
          View this employee&apos;s group risk →
        </Link>
      </div>

      <Card className="border-info/30 bg-info/5 py-3">
        <CardContent className="flex items-start gap-2.5 px-4 text-sm text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0 text-info" />
          No suggested action is generated at the individual level. Retention recommendations are attached only to
          groups — this page exists for exploration and validation, not for targeting a person.
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Individual risk trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-3 text-3xl font-semibold tabular-nums">{e.riskScore}</div>
            <TrendSparkline data={e.riskHistory} height={110} />
            <div className="mt-2 flex justify-between text-xs text-muted-foreground">
              {e.riskHistory.map((t) => (
                <span key={t.quarter}>{t.quarter}</span>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Top contributing factors</CardTitle>
          </CardHeader>
          <CardContent>
            <FactorBarChart factors={topFactors(e.factors, 5)} height={190} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Underlying attributes</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Tenure" value={`${e.tenureMonths} months`} />
          <Stat label="Age band" value={e.ageBand} />
          <Stat label="Compensation ratio" value={e.compRatio.toFixed(2)} />
          <Stat label="Engagement score" value={`${e.engagementScore} / 100`} />
          <Stat label="Utilization" value={`${e.utilizationPct}%`} />
          <Stat label="Manager span" value={`${e.managerSpan} reports`} />
          <Stat label="Recent promotion" value={e.recentPromotion ? "Yes" : "No"} />
          <Stat label="Performance rating" value={`${e.performanceRating} / 5`} />
          <Stat label="Commute" value={`${e.commuteMinutes} min`} />
        </CardContent>
      </Card>
    </div>
  );
}
