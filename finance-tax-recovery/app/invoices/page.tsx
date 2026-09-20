import { getInvoices } from "@/lib/data";
import { InvoicesClient } from "@/components/invoices-client";

export default function InvoicesPage() {
  return <InvoicesClient invoices={getInvoices()} />;
}
