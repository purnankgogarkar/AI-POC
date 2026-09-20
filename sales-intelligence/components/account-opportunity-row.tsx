"use client";

import { useRouter } from "next/navigation";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { StallRiskBadge } from "@/components/stall-risk-badge";
import type { Opportunity } from "@/lib/types";

const currency = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export function AccountOpportunityRow({ opportunity: o }: { opportunity: Opportunity }) {
  const router = useRouter();

  return (
    <TableRow className="cursor-pointer" onClick={() => router.push(`/opportunities/${o.id}`)}>
      <TableCell className="font-medium">{o.productCategory}</TableCell>
      <TableCell>
        <Badge variant="secondary" className="font-normal">
          {o.stage}
        </Badge>
      </TableCell>
      <TableCell className="text-right tabular-nums">{currency(o.amount)}</TableCell>
      <TableCell className="text-right tabular-nums text-muted-foreground">{Math.round(o.winProbability * 100)}%</TableCell>
      <TableCell>
        <StallRiskBadge tier={o.stallRiskTier} />
      </TableCell>
      <TableCell className="text-right tabular-nums font-semibold">{currency(o.priorityScore)}</TableCell>
    </TableRow>
  );
}
