import Link from "next/link";
import { DollarSign, FileWarning, ShieldAlert, FileClock } from "lucide-react";
import { KpiCard } from "@/components/kpi-card";
import { StatusBadge } from "@/components/status-badge";
import { MonthlyTrendChart } from "@/components/monthly-trend-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardKpis, getInvoices, getMonthlyTrend, getStatusBreakdown } from "@/lib/data";
import type { InvoiceStatus } from "@/lib/types";

const currency = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });

export default function DashboardPage() {
  const kpis = getDashboardKpis();
  const trend = getMonthlyTrend();
  const breakdown = getStatusBreakdown();
  const invoices = getInvoices();

  const topRecovery = [...invoices].sort((a, b) => b.recoveryAmount - a.recoveryAmount).slice(0, 5);
  const topExposure = [...invoices].sort((a, b) => b.exposureAmount - a.exposureAmount).slice(0, 5);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Tax validation & recovery</h1>
        <p className="text-sm text-muted-foreground">
          Denver, CO jurisdiction · material &amp; equipment line items · synthesized data.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Recovery opportunity" value={currency(kpis.totalRecovery)} icon={DollarSign} accent />
        <KpiCard label="Audit exposure" value={currency(kpis.totalExposure)} icon={ShieldAlert} />
        <KpiCard label="Invoices processed" value={kpis.invoiceCount.toLocaleString()} icon={FileWarning} />
        <KpiCard label="Needs review" value={kpis.needsReview.toLocaleString()} icon={FileClock} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Recovery vs. exposure by month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MonthlyTrendChart data={trend} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Status breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(Object.keys(breakdown) as InvoiceStatus[]).map((status) => (
              <div key={status} className="flex items-center justify-between text-sm">
                <StatusBadge status={status} />
                <span className="tabular-nums text-muted-foreground">
                  {breakdown[status]} ({Math.round((breakdown[status] / kpis.invoiceCount) * 100)}%)
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Top recovery candidates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {topRecovery.map((inv) => (
              <Link
                key={inv.id}
                href={`/invoices/${inv.id}`}
                className="flex items-center justify-between rounded-lg px-2 py-2 text-sm hover:bg-accent/50"
              >
                <span>
                  {inv.vendorName} <span className="text-muted-foreground">· {inv.invoiceNumber}</span>
                </span>
                <span className="tabular-nums font-medium text-info">{currency(inv.recoveryAmount)}</span>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Top audit exposure</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {topExposure.map((inv) => (
              <Link
                key={inv.id}
                href={`/invoices/${inv.id}`}
                className="flex items-center justify-between rounded-lg px-2 py-2 text-sm hover:bg-accent/50"
              >
                <span>
                  {inv.vendorName} <span className="text-muted-foreground">· {inv.invoiceNumber}</span>
                </span>
                <span className="tabular-nums font-medium text-danger">{currency(inv.exposureAmount)}</span>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
