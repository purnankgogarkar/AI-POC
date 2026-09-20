import { mulberry32, pick, weightedPick, chance, gaussian, randInt, clamp, round, type Rng } from "@/lib/random";
import { resolveJurisdiction, expectedTaxFor } from "@/lib/tax-rules";
import { classifyLine } from "@/lib/classify";
import type { Address, Invoice, LineItem, LineItemType, InvoiceStatus } from "@/lib/types";

const VENDOR_NAMES = [
  "Rocky Mountain Steel Supply", "Front Range Fabrication Co.", "Mile High Rebar & Mesh",
  "Continental Divide Materials", "Peak Equipment Rentals", "Summit Crane & Rigging",
  "Ironclad Welding Supply", "Highland Scaffold Systems", "Prairie Bolt & Fastener",
  "Denver Metro Steel Distributors", "Alpine Heavy Equipment", "Cascade Coatings & Galvanizing",
  "Trailhead Tool & Supply", "Bluepeak Industrial Rentals", "Redstone Structural Products",
  "Timberline Generator Rentals", "Gateway Metals & Alloys", "Union Pacific Fastener Co.",
  "Granite Peak Forklift Leasing", "Aspen Ridge Welding Consumables", "Silverline Steel Works",
  "Foothills Compressor Rentals", "Wheat Ridge Anchor Systems", "Lone Tree Equipment Leasing",
  "Cherry Creek Industrial Supply", "South Platte Materials Group", "Eastgate Metal Fabricators",
  "Northbrook Rebar Supply", "Westcliff Rentals & Leasing", "Centennial Steel Traders",
] as const;

const MATERIAL_DESCRIPTIONS = [
  "Structural steel plate, A36", "Rebar bundle, #5 grade 60", "Welding consumables (rod/wire)",
  "Galvanized anchor bolts, 3/4in", "HSS structural tubing", "Wide-flange beam, W12x26",
  "Galvanized coating treatment", "Metal decking, 20-gauge", "Steel channel stock, C6x8.2",
  "Structural fasteners, grade 8", "Base plate assembly", "Shop primer coating",
] as const;

const EQUIPMENT_DESCRIPTIONS = [
  "Crane rental, 50-ton mobile", "Forklift lease, 8,000 lb", "Diesel generator rental, 100kW",
  "Scaffolding system rental", "Air compressor rental, tow-behind", "Man lift rental, 40ft boom",
  "Welding machine rental", "Plate roller rental", "Portable light tower rental",
] as const;

const STREETS = [
  "Blake St", "Wazee St", "Larimer St", "Brighton Blvd", "Federal Blvd", "Colfax Ave",
  "Alameda Ave", "Evans Ave", "Broadway", "Santa Fe Dr", "Colorado Blvd", "Sheridan Blvd",
] as const;

// A mix of ordinary Denver zips plus a few boundary zips (see tax-rules.ts),
// weighted so the "ambiguous jurisdiction" edge case is a real but minority
// occurrence — a known hard case, not the common case.
const ZIP_WEIGHTS: readonly (readonly [string, number])[] = [
  ["80202", 12], ["80205", 12], ["80209", 12], ["80212", 12], ["80223", 12],
  ["80231", 12], ["80237", 12],
  ["80219", 2], ["80236", 2], ["80123", 2],
];

function randomAddress(rng: Rng): Address {
  return {
    street: `${randInt(rng, 100, 9900)} ${pick(rng, STREETS)}`,
    city: "Denver",
    state: "CO",
    zip: weightedPick(rng, ZIP_WEIGHTS),
  };
}

function randomDate(rng: Rng): string {
  // last ~12 months ending 2026-09-20 ("today" for this dataset)
  const end = new Date("2026-09-20").getTime();
  const start = end - 365 * 24 * 60 * 60 * 1000;
  const t = start + rng() * (end - start);
  return new Date(t).toISOString().slice(0, 10);
}

function generateLineItem(rng: Rng, id: string, jurisdiction: ReturnType<typeof resolveJurisdiction>): LineItem {
  const type: LineItemType = chance(rng, 0.62) ? "Material" : "Equipment";
  const description = pick(rng, type === "Material" ? MATERIAL_DESCRIPTIONS : EQUIPMENT_DESCRIPTIONS);
  const amount = round(clamp(gaussian(rng, type === "Material" ? 3200 : 5400, 2600), 120, 42000), 2);

  const extractionConfidence = round(clamp(gaussian(rng, 0.94, 0.08), 0.45, 0.99), 2);
  const classificationConfidence = round(clamp(gaussian(rng, 0.95, 0.07), 0.45, 0.99), 2);

  const { expectedTaxRate, expectedTax } = expectedTaxFor(type, amount, jurisdiction);

  // Applied tax: most lines are coded correctly (small noise, within
  // tolerance); a deliberate minority are meaningfully off in either
  // direction, which is what actually produces recovery/underpayment flags.
  const rateNoise = chance(rng, 0.65) ? gaussian(rng, 0, 0.0012) : gaussian(rng, 0, 0.013);
  const appliedTaxRate = round(clamp(expectedTaxRate + rateNoise, 0, 0.14), 4);
  const appliedTax = round(amount * appliedTaxRate, 2);

  const { status, reviewReason } = classifyLine({
    amount,
    appliedTax,
    expectedTax,
    extractionConfidence,
    classificationConfidence,
    jurisdiction,
  });

  return {
    id,
    description,
    type,
    classificationConfidence,
    amount,
    appliedTaxRate,
    appliedTax,
    expectedTaxRate,
    expectedTax,
    variance: round(appliedTax - expectedTax, 2),
    extractionConfidence,
    status,
    reviewReason,
  };
}

const STATUS_PRIORITY: InvoiceStatus[] = ["Needs Review", "Underpayment Flag", "Recovery Candidate", "Passed"];

function invoiceStatusFrom(lineItems: LineItem[]): InvoiceStatus {
  const statuses = new Set(lineItems.map((l) => (l.status === "Match" ? "Passed" : l.status) as InvoiceStatus));
  return STATUS_PRIORITY.find((s) => statuses.has(s)) ?? "Passed";
}

export function generateInvoices(count: number, seed: number): Invoice[] {
  const rng = mulberry32(seed);
  const invoices: Invoice[] = [];

  for (let i = 0; i < count; i++) {
    const id = `INV${String(i + 1).padStart(5, "0")}`;
    const address = randomAddress(rng);
    const jurisdiction = resolveJurisdiction(address);
    const lineItemCount = randInt(rng, 1, 6);

    const lineItems = Array.from({ length: lineItemCount }, (_, j) =>
      generateLineItem(rng, `${id}-L${j + 1}`, jurisdiction)
    );

    const totalAmount = round(lineItems.reduce((s, l) => s + l.amount, 0), 2);
    const totalApplied = round(lineItems.reduce((s, l) => s + l.appliedTax, 0), 2);
    const totalExpected = round(lineItems.reduce((s, l) => s + l.expectedTax, 0), 2);
    const recoveryAmount = round(
      lineItems.filter((l) => l.status === "Recovery Candidate").reduce((s, l) => s + l.variance, 0),
      2
    );
    const exposureAmount = round(
      lineItems.filter((l) => l.status === "Underpayment Flag").reduce((s, l) => s + -l.variance, 0),
      2
    );

    invoices.push({
      id,
      invoiceNumber: `${randInt(rng, 2026, 2026)}-${String(randInt(rng, 1000, 9999))}`,
      vendorName: pick(rng, VENDOR_NAMES),
      invoiceDate: randomDate(rng),
      address,
      jurisdiction,
      lineItems,
      status: invoiceStatusFrom(lineItems),
      totalAmount,
      totalApplied,
      totalExpected,
      recoveryAmount,
      exposureAmount,
    });
  }

  return invoices.sort((a, b) => (a.invoiceDate < b.invoiceDate ? 1 : -1));
}
