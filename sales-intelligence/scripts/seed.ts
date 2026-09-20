import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { generateSalesData } from "@/lib/generate-sales-data";

const SEED = 31;
const ACCOUNT_COUNT = 50;

const { accounts, opportunities } = generateSalesData(ACCOUNT_COUNT, SEED);

const dataDir = join(process.cwd(), "data");
mkdirSync(dataDir, { recursive: true });

writeFileSync(join(dataDir, "accounts.json"), JSON.stringify(accounts, null, 2));
writeFileSync(join(dataDir, "opportunities.json"), JSON.stringify(opportunities, null, 2));

writeFileSync(
  join(dataDir, "meta.json"),
  JSON.stringify(
    {
      seed: SEED,
      accountCount: accounts.length,
      opportunityCount: opportunities.length,
      generatedAt: new Date().toISOString().slice(0, 10),
    },
    null,
    2
  )
);

console.log(`Seeded ${accounts.length} accounts and ${opportunities.length} open opportunities -> data/`);
