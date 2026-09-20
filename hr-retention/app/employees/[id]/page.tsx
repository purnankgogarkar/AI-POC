import { notFound } from "next/navigation";
import { getEmployeeById } from "@/lib/data";
import { EmployeeDetailClient } from "@/components/employee-detail-client";

export default async function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const employee = getEmployeeById(id);
  if (!employee) notFound();

  return <EmployeeDetailClient employee={employee} />;
}
