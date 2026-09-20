import invoicesJson from "@/data/invoices.json";
import type { Invoice } from "@/lib/types";

const invoices = invoicesJson as unknown as Invoice[];

export function getInvoices(): Invoice[] {
  return invoices;
}

export function getInvoiceById(id: string): Invoice | undefined {
  return invoices.find((i) => i.id === id);
}

export function getDashboardKpis() {
  const totalRecovery = invoices.reduce((s, i) => s + i.recoveryAmount, 0);
  const totalExposure = invoices.reduce((s, i) => s + i.exposureAmount, 0);
  const needsReview = invoices.filter((i) => i.status === "Needs Review").length;
  const totalInvoiced = invoices.reduce((s, i) => s + i.totalAmount, 0);

  return {
    invoiceCount: invoices.length,
    totalRecovery: Math.round(totalRecovery * 100) / 100,
    totalExposure: Math.round(totalExposure * 100) / 100,
    needsReview,
    totalInvoiced: Math.round(totalInvoiced * 100) / 100,
  };
}

export function getStatusBreakdown() {
  const counts: Record<string, number> = { Passed: 0, "Recovery Candidate": 0, "Underpayment Flag": 0, "Needs Review": 0 };
  for (const i of invoices) counts[i.status]++;
  return counts;
}

/** Monthly recovery vs. exposure trend, derived from invoice dates. */
export function getMonthlyTrend() {
  const byMonth = new Map<string, { recovery: number; exposure: number }>();
  for (const i of invoices) {
    const month = i.invoiceDate.slice(0, 7);
    const entry = byMonth.get(month) ?? { recovery: 0, exposure: 0 };
    entry.recovery += i.recoveryAmount;
    entry.exposure += i.exposureAmount;
    byMonth.set(month, entry);
  }
  return Array.from(byMonth.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([month, v]) => ({
      month,
      recovery: Math.round(v.recovery),
      exposure: Math.round(v.exposure),
    }));
}
