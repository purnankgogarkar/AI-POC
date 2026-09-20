import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  accent = false,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: LucideIcon;
  accent?: boolean;
}) {
  return (
    <Card className="gap-2 py-5">
      <CardContent className="flex items-start justify-between gap-3 px-5">
        <div className="space-y-1.5">
          <div className="text-xs font-medium text-muted-foreground">{label}</div>
          <div className={cn("text-2xl font-semibold tabular-nums tracking-tight", accent && "text-primary")}>
            {value}
          </div>
          {hint ? <div className="text-xs text-muted-foreground">{hint}</div> : null}
        </div>
        {Icon ? (
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <Icon className="size-4.5" />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
