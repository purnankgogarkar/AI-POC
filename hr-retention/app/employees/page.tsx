import { getEmployees } from "@/lib/data";
import { EmployeesClient } from "@/components/employees-client";

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: Promise<{ department?: string; location?: string; jobRole?: string }>;
}) {
  const employees = getEmployees();
  const initialFilters = await searchParams;

  return <EmployeesClient employees={employees} initialFilters={initialFilters} />;
}
