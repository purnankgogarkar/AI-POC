"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Briefcase, Gauge, TriangleAlert, Clock3 } from "lucide-react";
import { KpiCard } from "@/components/kpi-card";
import { StallRiskBadge } from "@/components/stall-risk-badge";
import { TrendSparkline } from "@/components/trend-sparkline";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  ACCOUNT_TIERS,
  COUNTRIES,
  PRODUCT_CATEGORIES,
  STAGES,
  type Account,
  type AccountSummary,
  type AccountTier,
  type Country,
  type Opportunity,
  type ProductCategory,
  type Stage,
} from "@/lib/types";

const ALL = "__all__";
const currency = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export function OverviewClient({
  accountSummaries,
  opportunities,
  accounts,
  kpis,
}: {
  accountSummaries: AccountSummary[];
  opportunities: Opportunity[];
  accounts: Account[];
  kpis: { opportunityCount: number; accountCount: number; totalPipeline: number; weightedPipeline: number; highStallRisk: number; avgCycleDays: number };
}) {
  const router = useRouter();
  const [view, setView] = useState<"account" | "opportunity">("account");
  const [country, setCountry] = useState<string>(ALL);
  const [tier, setTier] = useState<string>(ALL);
  const [category, setCategory] = useState<string>(ALL);
  const [stage, setStage] = useState<string>(ALL);

  const accountById = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);

  const filteredAccounts = useMemo(
    () =>
      accountSummaries
        .filter((s) => (country === ALL ? true : s.account.country === country))
        .filter((s) => (tier === ALL ? true : s.account.tier === tier))
        .sort((a, b) => b.totalPriorityValue - a.totalPriorityValue),
    [accountSummaries, country, tier]
  );

  const filteredOpportunities = useMemo(
    () =>
      opportunities
        .filter((o) => (country === ALL ? true : accountById.get(o.accountId)?.country === country))
        .filter((o) => (tier === ALL ? true : accountById.get(o.accountId)?.tier === tier))
        .filter((o) => (category === ALL ? true : o.productCategory === category))
        .filter((o) => (stage === ALL ? true : o.stage === stage))
        .sort((a, b) => b.priorityScore - a.priorityScore),
    [opportunities, accountById, country, tier, category, stage]
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">APAC pipeline overview</h1>
        <p className="text-sm text-muted-foreground">
          Predicted win probability and stall risk, blended into one priority score, across every open opportunity.
          Advisory only — this ranks where to focus, it doesn&apos;t assign or score reps.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Open pipeline" value={currency(kpis.totalPipeline)} hint={`${kpis.opportunityCount} opportunities`} icon={Briefcase} />
        <KpiCard label="Weighted pipeline" value={currency(kpis.weightedPipeline)} hint="Amount × win probability" icon={Gauge} accent />
        <KpiCard label="At elevated+ stall risk" value={`${kpis.highStallRisk}`} hint="Need attention now" icon={TriangleAlert} />
        <KpiCard label="Avg. deal cycle" value={`${kpis.avgCycleDays}d`} hint="Created → expected close" icon={Clock3} />
      </div>

      <Tabs value={view} onValueChange={(v) => v && setView(v as "account" | "opportunity")}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <TabsList>
            <TabsTrigger value="account">By Account</TabsTrigger>
            <TabsTrigger value="opportunity">By Opportunity</TabsTrigger>
          </TabsList>

          <div className="flex flex-wrap gap-2">
            <Select value={country} onValueChange={(v) => setCountry(v ?? ALL)}>
              <SelectTrigger className="w-40">
                <SelectValue>{() => (country === ALL ? "All countries" : country)}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All countries</SelectItem>
                {COUNTRIES.map((c: Country) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={tier} onValueChange={(v) => setTier(v ?? ALL)}>
              <SelectTrigger className="w-36">
                <SelectValue>{() => (tier === ALL ? "All tiers" : tier)}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All tiers</SelectItem>
                {ACCOUNT_TIERS.map((t: AccountTier) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {view === "opportunity" ? (
              <>
                <Select value={category} onValueChange={(v) => setCategory(v ?? ALL)}>
                  <SelectTrigger className="w-44">
                    <SelectValue>{() => (category === ALL ? "All categories" : category)}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>All categories</SelectItem>
                    {PRODUCT_CATEGORIES.map((c: ProductCategory) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={stage} onValueChange={(v) => setStage(v ?? ALL)}>
                  <SelectTrigger className="w-36">
                    <SelectValue>{() => (stage === ALL ? "All stages" : stage)}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>All stages</SelectItem>
                    {STAGES.map((s: Stage) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            ) : null}
          </div>
        </div>

        <TabsContent value="account">
          <div className="overflow-hidden rounded-xl border border-border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead>Account</TableHead>
                  <TableHead className="hidden md:table-cell">Location</TableHead>
                  <TableHead className="hidden sm:table-cell">Tier</TableHead>
                  <TableHead className="text-right">Open opps</TableHead>
                  <TableHead className="text-right">Pipeline</TableHead>
                  <TableHead className="text-right">Priority value</TableHead>
                  <TableHead>Stall risk</TableHead>
                  <TableHead className="hidden lg:table-cell w-28">Trend</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAccounts.map((s) => (
                  <TableRow key={s.account.id} className="cursor-pointer" onClick={() => router.push(`/accounts/${s.account.id}`)}>
                    <TableCell className="font-medium">{s.account.name}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {s.account.city}, {s.account.country}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="secondary" className="font-normal">
                        {s.account.tier}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">{s.openOpportunityCount}</TableCell>
                    <TableCell className="text-right tabular-nums">{currency(s.totalPipeline)}</TableCell>
                    <TableCell className="text-right tabular-nums font-semibold">{currency(s.totalPriorityValue)}</TableCell>
                    <TableCell>
                      <StallRiskBadge tier={s.avgStallRiskTier} />
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <TrendSparkline data={s.trend} height={32} metricLabel="Avg. stall risk" domain={[0, 100]} />
                    </TableCell>
                  </TableRow>
                ))}
                {filteredAccounts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                      No accounts match these filters.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="opportunity">
          <div className="overflow-hidden rounded-xl border border-border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead>Account</TableHead>
                  <TableHead className="hidden md:table-cell">Category</TableHead>
                  <TableHead className="hidden sm:table-cell">Stage</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="hidden lg:table-cell text-right">Win prob.</TableHead>
                  <TableHead>Stall risk</TableHead>
                  <TableHead className="text-right">Priority</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOpportunities.slice(0, 50).map((o) => (
                  <TableRow key={o.id} className="cursor-pointer" onClick={() => router.push(`/opportunities/${o.id}`)}>
                    <TableCell className="font-medium">{accountById.get(o.accountId)?.name ?? o.accountId}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">{o.productCategory}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="secondary" className="font-normal">
                        {o.stage}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{currency(o.amount)}</TableCell>
                    <TableCell className="hidden lg:table-cell text-right tabular-nums text-muted-foreground">
                      {Math.round(o.winProbability * 100)}%
                    </TableCell>
                    <TableCell>
                      <StallRiskBadge tier={o.stallRiskTier} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-semibold">{currency(o.priorityScore)}</TableCell>
                  </TableRow>
                ))}
                {filteredOpportunities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                      No opportunities match these filters.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
          {filteredOpportunities.length > 50 ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Showing the top 50 of {filteredOpportunities.length} by priority. Narrow with filters to see more.
            </p>
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  );
}
