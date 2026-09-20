import { cn } from "@/lib/utils";
import type { InvoiceStatus, LineStatus } from "@/lib/types";

type Status = InvoiceStatus | LineStatus;

const STATUS_STYLES: Record<Status, string> = {
  Passed: "bg-success/12 text-success border-success/25",
  Match: "bg-success/12 text-success border-success/25",
  "Recovery Candidate": "bg-info/12 text-info border-info/25",
  "Underpayment Flag": "bg-danger/12 text-danger border-danger/25",
  "Needs Review": "bg-warning/15 text-warning-foreground border-warning/30 dark:text-warning",
};

const STATUS_DOT: Record<Status, string> = {
  Passed: "bg-success",
  Match: "bg-success",
  "Recovery Candidate": "bg-info",
  "Underpayment Flag": "bg-danger",
  "Needs Review": "bg-warning",
};

export function StatusBadge({ status, className }: { status: Status; className?: string }) {
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
