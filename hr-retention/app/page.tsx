import { getAllGroupsByDimension, getOrgKpis } from "@/lib/data";
import { OverviewClient } from "@/components/overview-client";

export default function OverviewPage() {
  const groupsByDimension = getAllGroupsByDimension();
  const kpis = getOrgKpis();

  return <OverviewClient groupsByDimension={groupsByDimension} kpis={kpis} />;
}
