import { cn } from "@/lib/utils";
import type { PackageStatus } from "@/lib/types";

const STYLES: Record<PackageStatus, string> = {
  "Draft Generated": "bg-info/12 text-info border-info/25",
  "Needs Review": "bg-warning/15 text-warning-foreground border-warning/30 dark:text-warning",
  Approved: "bg-primary/12 text-primary border-primary/25",
  Released: "bg-success/12 text-success border-success/25",
};

const DOT: Record<PackageStatus, string> = {
  "Draft Generated": "bg-info",
  "Needs Review": "bg-warning",
  Approved: "bg-primary",
  Released: "bg-success",
};

export function PackageStatusBadge({ status, className }: { status: PackageStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        STYLES[status],
        className
      )}
    >
      <span className={cn("size-1.5 rounded-full", DOT[status])} />
      {status}
    </span>
  );
}
