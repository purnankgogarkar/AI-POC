import { getPackageById } from "@/lib/data";
import { PackageWorkbenchClient } from "@/components/package-workbench-client";

export default async function PackageDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pkg = getPackageById(id) ?? null;

  return <PackageWorkbenchClient id={id} initialPackage={pkg} />;
}
