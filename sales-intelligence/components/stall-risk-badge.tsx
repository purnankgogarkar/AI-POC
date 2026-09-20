import { cn } from "@/lib/utils";
import type { StallRiskTier } from "@/lib/types";

const TIER_STYLES: Record<StallRiskTier, string> = {
  Low: "bg-success/12 text-success border-success/25 dark:bg-success/15",
  Moderate: "bg-warning/15 text-warning-foreground border-warning/30 dark:text-warning",
  Elevated: "bg-elevated/15 text-elevated-foreground border-elevated/30 dark:text-elevated",
  Critical: "bg-danger/15 text-danger border-danger/30 dark:bg-danger/20",
};

const TIER_DOT: Record<StallRiskTier, string> = {
  Low: "bg-success",
  Moderate: "bg-warning",
  Elevated: "bg-elevated",
  Critical: "bg-danger",
};

export function StallRiskBadge({ tier, className }: { tier: StallRiskTier; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        TIER_STYLES[tier],
        className
      )}
    >
      <span className={cn("size-1.5 rounded-full", TIER_DOT[tier])} />
      {tier}
    </span>
  );
}
