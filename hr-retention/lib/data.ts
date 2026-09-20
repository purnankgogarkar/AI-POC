import employeesJson from "@/data/employees.json";
import { aggregateGroups } from "@/lib/scoring";
import type { AggregationDimension, Employee, GroupRisk } from "@/lib/types";

const employees = employeesJson as unknown as Employee[];

export const AGGREGATION_DIMENSIONS: { value: AggregationDimension; label: string }[] = [
  { value: "department", label: "Department" },
  { value: "location", label: "Location" },
  { value: "department-location", label: "Department × Location" },
  { value: "jobRole", label: "Job Role" },
];

export function getEmployees(): Employee[] {
  return employees;
}

export function getEmployeeById(id: string): Employee | undefined {
  return employees.find((e) => e.id === id);
}

const groupCache = new Map<AggregationDimension, GroupRisk[]>();

export function getGroups(dimension: AggregationDimension): GroupRisk[] {
  if (!groupCache.has(dimension)) {
    groupCache.set(dimension, aggregateGroups(employees, dimension));
  }
  return groupCache.get(dimension)!;
}

export function getAllGroupsByDimension(): Record<AggregationDimension, GroupRisk[]> {
  return {
    department: getGroups("department"),
    location: getGroups("location"),
    "department-location": getGroups("department-location"),
    jobRole: getGroups("jobRole"),
  };
}

export function getGroupById(id: string): GroupRisk | undefined {
  const dimension = id.slice(0, id.indexOf(":")) as AggregationDimension;
  return getGroups(dimension).find((g) => g.id === id);
}

export function getOrgKpis() {
  const headcount = employees.length;
  const avgRisk = Math.round(employees.reduce((s, e) => s + e.riskScore, 0) / headcount);
  const lastScored = employees[0]?.riskHistory.at(-1)?.quarter ?? "";
  return { headcount, avgRisk, lastScored };
}
