import { getPackages } from "@/lib/data";
import { PackagesClient } from "@/components/packages-client";

export default function PackagesPage() {
  return <PackagesClient packages={getPackages()} />;
}
