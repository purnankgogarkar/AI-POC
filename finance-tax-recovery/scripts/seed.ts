import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { generateInvoices } from "@/lib/generate-invoices";

const SEED = 7;
const INVOICE_COUNT = 200;

const invoices = generateInvoices(INVOICE_COUNT, SEED);

const dataDir = join(process.cwd(), "data");
mkdirSync(dataDir, { recursive: true });

writeFileSync(join(dataDir, "invoices.json"), JSON.stringify(invoices, null, 2));

writeFileSync(
  join(dataDir, "meta.json"),
  JSON.stringify(
    { seed: SEED, invoiceCount: invoices.length, generatedAt: new Date().toISOString().slice(0, 10) },
    null,
    2
  )
);

console.log(`Seeded ${invoices.length} synthetic invoices -> data/invoices.json`);
