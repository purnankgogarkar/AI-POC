import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { generatePackages } from "@/lib/generate-packages";

const SEED = 19;
const PACKAGE_COUNT = 110;

const packages = generatePackages(PACKAGE_COUNT, SEED);

const dataDir = join(process.cwd(), "data");
mkdirSync(dataDir, { recursive: true });

writeFileSync(join(dataDir, "packages.json"), JSON.stringify(packages, null, 2));

writeFileSync(
  join(dataDir, "meta.json"),
  JSON.stringify(
    { seed: SEED, packageCount: packages.length, generatedAt: new Date().toISOString().slice(0, 10) },
    null,
    2
  )
);

console.log(`Seeded ${packages.length} synthetic production packages -> data/packages.json`);
