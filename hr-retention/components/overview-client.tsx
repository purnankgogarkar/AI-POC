"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Gauge, TriangleAlert, CalendarClock } from "lucide-react";
import { KpiCard } from "@/components/kpi-card";
import { RiskTierBadge } from "@/components/risk-tier-badge";
import { TrendSparkline } from "@/components/trend-sparkline";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AGGREGATION_DIMENSIONS } from "@/lib/data";
import { RISK_TIER_ORDER } from "@/lib/scoring";
import type { AggregationDimension, GroupRisk } from "@/lib/types";

export function OverviewClient({
  groupsByDimension,
  kpis,
}: {
  groupsByDimension: Record<AggregationDimension, GroupRisk[]>;
  kpis: { headcount: number; avgRisk: number; lastScored: string };
}) {
  const [dimension, setDimension] = useState<AggregationDimension>("department-location");
  const router = useRouter();

  const groups = groupsByDimension[dimension];

  const elevatedCount = useMemo(
    () => groups.filter((g) => RISK_TIER_ORDER[g.riskTier] >= RISK_TIER_ORDER.Elevated).length,
    [groups]
  );

  const topGroup = groups[0];

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Retention risk overview</h1>
        <p className="text-sm text-muted-foreground">
          Group-level attrition risk, aggregated on synthesized workforce data. No individual employee risk score is
          used to drive action — this view is designed to be shared with business leaders as-is.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Headcount covered" value={kpis.headcount.toLocaleString()} icon={Users} />
        <KpiCard label="Org-wide average risk" value={`${kpis.avgRisk}`} hint="0–100 scale" icon={Gauge} />
        <KpiCard
          label="Groups at Elevated+ risk"
          value={`${elevatedCount} / ${groups.length}`}
          hint={`Viewing by ${AGGREGATION_DIMENSIONS.find((d) => d.value === dimension)?.label}`}
          icon={TriangleAlert}
        />
        <KpiCard
          label="Last scored"
          value={kpis.lastScored}
          hint="Quarterly cadence"
          icon={CalendarClock}
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-medium">Ranked by average risk</div>
          <div className="text-xs text-muted-foreground">
            {topGroup ? (
              <>
                Highest: <span className="font-medium text-foreground">{topGroup.label}</span> at{" "}
                {topGroup.avgRisk}
              </>
            ) : null}
          </div>
        </div>
        <Select value={dimension} onValueChange={(v) => setDimension(v as AggregationDimension)}>
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue>
              {() =>
                `Aggregate by: ${AGGREGATION_DIMENSIONS.find((d) => d.value === dimension)?.label ?? dimension}`
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {AGGREGATION_DIMENSIONS.map((d) => (
              <SelectItem key={d.value} value={d.value}>
                Aggregate by: {d.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead>Group</TableHead>
              <TableHead className="text-right">Headcount</TableHead>
              <TableHead>Risk</TableHead>
              <TableHead className="hidden lg:table-cell">Top drivers</TableHead>
              <TableHead className="hidden w-32 sm:table-cell">Trend</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.map((g) => (
              <TableRow
                key={g.id}
                className="cursor-pointer"
                onClick={() => router.push(`/groups/${encodeURIComponent(g.id)}`)}
              >
                <TableCell className="font-medium">{g.label}</TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">{g.headcount}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="tabular-nums font-semibold">{g.avgRisk}</span>
                    <RiskTierBadge tier={g.riskTier} />
                  </div>
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <div className="flex flex-wrap gap-1.5">
                    {g.topFactors.slice(0, 2).map((f) => (
                      <Badge key={f.key} variant="secondary" className="font-normal">
                        {f.label}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <TrendSparkline data={g.trend} height={36} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
