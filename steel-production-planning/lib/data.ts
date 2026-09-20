import packagesJson from "@/data/packages.json";
import type { PackageInstance } from "@/lib/types";
import { PLANNERS } from "@/lib/generate-packages";

const packages = packagesJson as unknown as PackageInstance[];

export function getPackages(): PackageInstance[] {
  return packages;
}

export function getPackageById(id: string): PackageInstance | undefined {
  return packages.find((p) => p.id === id);
}

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * These are illustrative, recommended KPIs computed from the synthesized
 * dataset — NOT measured baselines. The source brief is explicit that no
 * current-state baseline exists for this workflow; that framing carries
 * through here rather than being silently dropped.
 */
export function getDashboardKpis() {
  const released = packages.filter((p) => p.status === "Released");

  const cycleTimes = released.map((p) => daysBetween(p.requestedAt, p.releasedAt!));
  const avgCycleTimeDays = cycleTimes.length ? Math.round((cycleTimes.reduce((a, b) => a + b, 0) / cycleTimes.length) * 10) / 10 : 0;

  const avgEffortHours = Math.round((packages.reduce((s, p) => s + p.effortHours, 0) / packages.length) * 10) / 10;

  const firstPassCompletePct = Math.round(
    (packages.filter((p) => p.firstPassComplete).length / packages.length) * 100
  );

  const totalFields = packages.reduce((s, p) => s + p.requirements.length, 0);
  const totalExceptions = packages.reduce((s, p) => s + p.originalExceptionCount, 0);
  const exceptionRatePct = Math.round((totalExceptions / totalFields) * 100);

  const packagesWithCorrections = packages.filter((p) => p.correctionsCount > 0).length;
  const reworkRatePct = Math.round((packagesWithCorrections / packages.length) * 100);

  const requestDates = packages.map((p) => new Date(p.requestedAt).getTime());
  const weeksSpan = Math.max(1, (Math.max(...requestDates) - Math.min(...requestDates)) / (7 * 24 * 60 * 60 * 1000));
  const plannerCapacityPerWeek = Math.round((packages.length / PLANNERS.length / weeksSpan) * 10) / 10;

  const onTime = released.filter((p) => p.releasedAt! <= p.requiredByDate).length;
  const onTimeReleasePct = released.length ? Math.round((onTime / released.length) * 100) : 0;

  const avgDownstreamIssues = released.length
    ? Math.round((released.reduce((s, p) => s + p.downstreamIssues, 0) / released.length) * 10) / 10
    : 0;

  return {
    packageCount: packages.length,
    avgCycleTimeDays,
    avgEffortHours,
    firstPassCompletePct,
    exceptionRatePct,
    reworkRatePct,
    plannerCapacityPerWeek,
    onTimeReleasePct,
    avgDownstreamIssues,
  };
}

export function getStatusBreakdown() {
  const counts: Record<string, number> = { "Draft Generated": 0, "Needs Review": 0, Approved: 0, Released: 0 };
  for (const p of packages) counts[p.status]++;
  return counts;
}
