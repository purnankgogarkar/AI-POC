import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { generateEmployees } from "@/lib/generate-employees";

const SEED = 42;
const EMPLOYEE_COUNT = 400;

const employees = generateEmployees(EMPLOYEE_COUNT, SEED);

const dataDir = join(process.cwd(), "data");
mkdirSync(dataDir, { recursive: true });

writeFileSync(join(dataDir, "employees.json"), JSON.stringify(employees, null, 2));

writeFileSync(
  join(dataDir, "meta.json"),
  JSON.stringify(
    {
      seed: SEED,
      employeeCount: employees.length,
      generatedAt: new Date().toISOString().slice(0, 10),
    },
    null,
    2
  )
);

console.log(`Seeded ${employees.length} synthetic employees -> data/employees.json`);
