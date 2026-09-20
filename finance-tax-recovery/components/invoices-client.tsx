"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
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
import { useUploadedInvoices } from "@/lib/use-uploaded-invoices";
import { INVOICE_STATUSES, type Invoice, type InvoiceStatus } from "@/lib/types";

const ALL = "__all__";
const PAGE_SIZE = 25;
const currency = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });

export function InvoicesClient({ invoices }: { invoices: Invoice[] }) {
  const [uploaded] = useUploadedInvoices();
  const all = useMemo(() => [...uploaded, ...invoices], [uploaded, invoices]);

  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>(ALL);
  const [page, setPage] = useState(0);

  const filtered = useMemo(
    () =>
      all
        .filter((i) => (status === ALL ? true : i.status === status))
        .filter((i) =>
          search
            ? i.vendorName.toLowerCase().includes(search.toLowerCase()) ||
              i.invoiceNumber.toLowerCase().includes(search.toLowerCase())
            : true
        ),
    [all, status, search]
  );

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const visible = filtered.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE);

  function updateSearch(value: string) {
    setSearch(value);
    setPage(0);
  }

  function updateStatus(value: string) {
    setStatus(value);
    setPage(0);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Invoices</h1>
        <p className="text-sm text-muted-foreground">
          {all.length} processed invoice{all.length === 1 ? "" : "s"} — Denver, CO jurisdiction, material &amp;
          equipment line items.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative sm:w-72">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search vendor or invoice #…"
            className="pl-8"
            value={search}
            onChange={(e) => updateSearch(e.target.value)}
          />
        </div>
        <Select value={status} onValueChange={(v) => updateStatus(v ?? ALL)}>
          <SelectTrigger className="sm:w-52">
            <SelectValue>{() => (status === ALL ? "All statuses" : status)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All statuses</SelectItem>
            {INVOICE_STATUSES.map((s: InvoiceStatus) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead>Vendor</TableHead>
              <TableHead className="hidden sm:table-cell">Invoice #</TableHead>
              <TableHead className="hidden md:table-cell">Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="hidden lg:table-cell text-right">Net impact</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((inv) => (
              <TableRow key={inv.id} className="cursor-pointer" onClick={() => router.push(`/invoices/${inv.id}`)}>
                <TableCell className="font-medium">{inv.vendorName}</TableCell>
                <TableCell className="hidden sm:table-cell text-muted-foreground">{inv.invoiceNumber}</TableCell>
                <TableCell className="hidden md:table-cell text-muted-foreground">{inv.invoiceDate}</TableCell>
                <TableCell className="text-right tabular-nums">{currency(inv.totalAmount)}</TableCell>
                <TableCell className="hidden lg:table-cell text-right tabular-nums">
                  {(() => {
                    const net = Math.round((inv.recoveryAmount - inv.exposureAmount) * 100) / 100;
                    if (net > 0) return <span className="text-info">+{currency(net)}</span>;
                    if (net < 0) return <span className="text-danger">-{currency(Math.abs(net))}</span>;
                    return <span className="text-muted-foreground">—</span>;
                  })()}
                </TableCell>
                <TableCell>
                  <StatusBadge status={inv.status} />
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                  No invoices match these filters.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Showing {filtered.length === 0 ? 0 : currentPage * PAGE_SIZE + 1}–
          {Math.min(filtered.length, (currentPage + 1) * PAGE_SIZE)} of {filtered.length}
        </span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={currentPage === 0} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= pageCount - 1}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
