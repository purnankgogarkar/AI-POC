"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2, Circle, Lightbulb, Users } from "lucide-react";
import { RiskTierBadge } from "@/components/risk-tier-badge";
import { TrendSparkline } from "@/components/trend-sparkline";
import { FactorBarChart } from "@/components/factor-bar-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocalFlag } from "@/lib/use-local-flag";
import type { GroupRisk } from "@/lib/types";

export function GroupDetailClient({ group }: { group: GroupRisk }) {
  const [investigated, setInvestigated] = useLocalFlag(`investigated:${group.id}`);

  const employeeQuery = new URLSearchParams();
  if (group.dimension === "department") employeeQuery.set("department", group.dimensionParts[0]);
  if (group.dimension === "location") employeeQuery.set("location", group.dimensionParts[0]);
  if (group.dimension === "department-location") {
    employeeQuery.set("department", group.dimensionParts[0]);
    employeeQuery.set("location", group.dimensionParts[1]);
  }
  if (group.dimension === "jobRole") employeeQuery.set("jobRole", group.dimensionParts[0]);

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to overview
      </Link>

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{group.label}</h1>
            <RiskTierBadge tier={group.riskTier} />
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Users className="size-4" /> {group.headcount} employees in this group
          </div>
        </div>
        <Button
          variant={investigated ? "secondary" : "default"}
          onClick={() => setInvestigated(!investigated)}
          className="shrink-0"
        >
          {investigated ? <CheckCircle2 className="size-4" /> : <Circle className="size-4" />}
          {investigated ? "Marked as investigated" : "Mark as investigated"}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Average risk trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-3 text-3xl font-semibold tabular-nums">{group.avgRisk}</div>
            <TrendSparkline data={group.trend} height={110} />
            <div className="mt-2 flex justify-between text-xs text-muted-foreground">
              {group.trend.map((t) => (
                <span key={t.quarter}>{t.quarter}</span>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Driver factors (business language, not raw model features)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FactorBarChart factors={group.topFactors} height={160} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Lightbulb className="size-4 text-primary" /> Recommended actions for this group
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {group.suggestions.map((s) => (
              <li key={s.id} className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-3 text-sm">
                <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-primary" />
                {s.text}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted-foreground">
            Suggestions are attached to this group, not to any named individual. Correlation informs investigation —
            it does not prescribe an action.
          </p>
        </CardContent>
      </Card>

      <div className="text-sm">
        <Link href={`/employees?${employeeQuery.toString()}`} className="text-primary hover:underline">
          View underlying employees in this group →
        </Link>
      </div>
    </div>
  );
}
