import { Bot, Scale, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FieldSource, FieldStatus } from "@/lib/types";

const STATUS_STYLES: Record<FieldStatus, string> = {
  Populated: "bg-success/12 text-success border-success/25",
  Missing: "bg-danger/12 text-danger border-danger/25",
  Incomplete: "bg-elevated/15 text-elevated-foreground border-elevated/30 dark:text-elevated",
  Conflict: "bg-warning/15 text-warning-foreground border-warning/30 dark:text-warning",
  "Low Confidence": "bg-info/12 text-info border-info/25",
};

const STATUS_DOT: Record<FieldStatus, string> = {
  Populated: "bg-success",
  Missing: "bg-danger",
  Incomplete: "bg-elevated",
  Conflict: "bg-warning",
  "Low Confidence": "bg-info",
};

export function FieldStatusBadge({ status, className }: { status: FieldStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        STATUS_STYLES[status],
        className
      )}
    >
      <span className={cn("size-1.5 rounded-full", STATUS_DOT[status])} />
      {status}
    </span>
  );
}

const SOURCE_ICON: Record<FieldSource, typeof Bot> = {
  Rule: Scale,
  AI: Bot,
  Human: User,
};

const SOURCE_LABEL: Record<FieldSource, string> = {
  Rule: "Rule-derived",
  AI: "AI-suggested",
  Human: "Human-entered",
};

export function SourceBadge({ source, className }: { source: FieldSource; className?: string }) {
  const Icon = SOURCE_ICON[source];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-2 py-0.5 text-xs text-muted-foreground",
        className
      )}
    >
      <Icon className="size-3" />
      {SOURCE_LABEL[source]}
    </span>
  );
}
