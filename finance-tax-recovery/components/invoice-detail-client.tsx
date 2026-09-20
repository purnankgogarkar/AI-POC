"use client";

import Link from "next/link";
import { ArrowLeft, Info, TriangleAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useUploadedInvoices } from "@/lib/use-uploaded-invoices";
import type { Invoice, JurisdictionBreakdown } from "@/lib/types";

const currency = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });
const pct = (n: number) => `${(n * 100).toFixed(2)}%`;

function citationFor(j: JurisdictionBreakdown) {
  return `${pct(j.stateRate)} ${j.state} + ${pct(j.countyRate)} ${j.county} + ${pct(j.specialDistrictRate)} ${j.specialDistrict} = ${pct(j.combinedRate)} combined`;
}

export function InvoiceDetailClient({ id, initialInvoice }: { id: string; initialInvoice: Invoice | null }) {
  const [uploaded] = useUploadedInvoices();
  const invoice = initialInvoice ?? uploaded.find((i) => i.id === id) ?? null;

  if (!invoice) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-16 text-center">
        <p className="text-sm text-muted-foreground">Invoice not found.</p>
        <Link href="/invoices" className="text-sm text-primary hover:underline">
          ← Back to invoices
        </Link>
      </div>
    );
  }

  const j = invoice.jurisdiction;

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <Link href="/invoices" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to invoices
      </Link>

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{invoice.vendorName}</h1>
            <StatusBadge status={invoice.status} />
          </div>
          <div className="text-sm text-muted-foreground">
            Invoice {invoice.invoiceNumber} · {invoice.invoiceDate} · {invoice.address.street}, {invoice.address.city},{" "}
            {invoice.address.state} {invoice.address.zip}
          </div>
        </div>
        <div className="flex gap-4 text-right">
          {invoice.recoveryAmount > 0 ? (
            <div>
              <div className="text-xs text-muted-foreground">Recovery opportunity</div>
              <div className="text-xl font-semibold text-info tabular-nums">{currency(invoice.recoveryAmount)}</div>
            </div>
          ) : null}
          {invoice.exposureAmount > 0 ? (
            <div>
              <div className="text-xs text-muted-foreground">Audit exposure</div>
              <div className="text-xl font-semibold text-danger tabular-nums">{currency(invoice.exposureAmount)}</div>
            </div>
          ) : null}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Jurisdiction</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <div className="text-xs text-muted-foreground">State</div>
              <div className="text-sm font-medium">
                {j.state} · {pct(j.stateRate)}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">County</div>
              <div className="text-sm font-medium">
                {j.county} · {pct(j.countyRate)}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Special district</div>
              <div className="text-sm font-medium">
                {j.specialDistrict} · {pct(j.specialDistrictRate)}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Combined rate</div>
              <div className="text-sm font-medium">{pct(j.combinedRate)}</div>
            </div>
          </div>
          {j.ambiguous ? (
            <div className="flex items-start gap-2.5 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm">
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning" />
              {j.ambiguousReason}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Line items</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="px-4 py-2 font-normal">Description</th>
                  <th className="px-4 py-2 font-normal">Type</th>
                  <th className="px-4 py-2 text-right font-normal">Amount</th>
                  <th className="px-4 py-2 text-right font-normal">Applied tax</th>
                  <th className="px-4 py-2 text-right font-normal">Expected tax</th>
                  <th className="px-4 py-2 text-right font-normal">Variance</th>
                  <th className="px-4 py-2 font-normal">Status</th>
                </tr>
              </thead>
              <tbody>
                {invoice.lineItems.map((l) => (
                  <tr key={l.id} className="border-b border-border/60 last:border-0">
                    <td className="px-4 py-3">{l.description}</td>
                    <td className="px-4 py-3 text-muted-foreground">{l.type}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{currency(l.amount)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {currency(l.appliedTax)}
                      <span className="ml-1 text-xs text-muted-foreground">({pct(l.appliedTaxRate)})</span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      <Tooltip>
                        <TooltipTrigger className="cursor-help underline decoration-dotted underline-offset-2">
                          {currency(l.expectedTax)}
                        </TooltipTrigger>
                        <TooltipContent className="max-w-64">{citationFor(j)}</TooltipContent>
                      </Tooltip>
                      <span className="ml-1 text-xs text-muted-foreground">({pct(l.expectedTaxRate)})</span>
                    </td>
                    <td
                      className={`px-4 py-3 text-right tabular-nums ${
                        l.status === "Recovery Candidate"
                          ? "text-info"
                          : l.status === "Underpayment Flag"
                            ? "text-danger"
                            : "text-muted-foreground"
                      }`}
                    >
                      {l.variance > 0 ? "+" : ""}
                      {currency(l.variance)}
                    </td>
                    <td className="px-4 py-3">
                      {l.status === "Needs Review" ? (
                        <Tooltip>
                          <TooltipTrigger>
                            <StatusBadge status={l.status} />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-64">{l.reviewReason}</TooltipContent>
                        </Tooltip>
                      ) : (
                        <StatusBadge status={l.status} />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="border-info/30 bg-info/5 py-3">
        <CardContent className="flex items-start gap-2.5 px-4 text-sm text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0 text-info" />
          Every result cites the jurisdiction and rate used. This is a flagged recommendation for Finance to
          investigate — nothing here posts or corrects any AP record automatically.
        </CardContent>
      </Card>
    </div>
  );
}
