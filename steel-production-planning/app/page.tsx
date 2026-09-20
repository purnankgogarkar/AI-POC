import { Clock3, Gauge, ListChecks, PackageCheck, RotateCcw, TriangleAlert, Users, TrendingUp } from "lucide-react";
import { KpiCard } from "@/components/kpi-card";
import { PackageStatusBadge } from "@/components/package-status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardKpis, getPackages, getStatusBreakdown } from "@/lib/data";
import type { PackageStatus, FieldSource } from "@/lib/types";

export default function DashboardPage() {
  const kpis = getDashboardKpis();
  const breakdown = getStatusBreakdown();
  const packages = getPackages();

  const sourceCounts: Record<FieldSource, number> = { Rule: 0, AI: 0, Human: 0 };
  let totalFields = 0;
  for (const p of packages) {
    for (const r of p.requirements) {
      sourceCounts[r.source]++;
      totalFields++;
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Production readiness</h1>
        <p className="text-sm text-muted-foreground">
          Today the planner assembles the package. Here, the system prepares a draft and the planner decides.
        </p>
      </div>

      <Card className="border-info/30 bg-info/5 py-3">
        <CardContent className="px-4 text-sm text-muted-foreground">
          These 8 metrics are <span className="font-medium text-foreground">recommended KPIs</span> computed from
          synthesized package history — not a measured current-state baseline. No baseline has been established for
          this workflow yet; treat these as the shape of what to track, not as a before/after claim.
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Package cycle time" value={`${kpis.avgCycleTimeDays}d`} hint="Request → released" icon={Clock3} />
        <KpiCard label="Manual planner effort" value={`${kpis.avgEffortHours}h`} hint="Avg. hours / package" icon={Users} />
        <KpiCard
          label="First-pass completeness"
          value={`${kpis.firstPassCompletePct}%`}
          hint="No required field missing"
          icon={PackageCheck}
          accent
        />
        <KpiCard label="Exception rate" value={`${kpis.exceptionRatePct}%`} hint="Of all fields" icon={TriangleAlert} />
        <KpiCard label="Rework / correction rate" value={`${kpis.reworkRatePct}%`} hint="Packages needing a fix" icon={RotateCcw} />
        <KpiCard label="Planner capacity" value={`${kpis.plannerCapacityPerWeek}`} hint="Packages / planner / week" icon={Gauge} />
        <KpiCard label="On-time release" value={`${kpis.onTimeReleasePct}%`} hint="At or before required date" icon={TrendingUp} />
        <KpiCard label="Downstream impact" value={`${kpis.avgDownstreamIssues}`} hint="Shop holds / RFIs per release" icon={ListChecks} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Package status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(Object.keys(breakdown) as PackageStatus[]).map((status) => (
              <div key={status} className="flex items-center justify-between text-sm">
                <PackageStatusBadge status={status} />
                <span className="tabular-nums text-muted-foreground">
                  {breakdown[status]} ({Math.round((breakdown[status] / kpis.packageCount) * 100)}%)
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              How fields are populated — rules, AI, and human judgment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-3 overflow-hidden rounded-full">
              <div className="bg-chart-1" style={{ width: `${(sourceCounts.Rule / totalFields) * 100}%` }} />
              <div className="bg-chart-2" style={{ width: `${(sourceCounts.AI / totalFields) * 100}%` }} />
              <div className="bg-chart-3" style={{ width: `${(sourceCounts.Human / totalFields) * 100}%` }} />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-chart-1" /> Rule
                </div>
                <div className="tabular-nums text-muted-foreground">
                  {Math.round((sourceCounts.Rule / totalFields) * 100)}% · predictable, same input → same result
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-chart-2" /> AI
                </div>
                <div className="tabular-nums text-muted-foreground">
                  {Math.round((sourceCounts.AI / totalFields) * 100)}% · proposes, doesn&apos;t authorize
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-chart-3" /> Human
                </div>
                <div className="tabular-nums text-muted-foreground">
                  {Math.round((sourceCounts.Human / totalFields) * 100)}% · resolves, approves, releases
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
