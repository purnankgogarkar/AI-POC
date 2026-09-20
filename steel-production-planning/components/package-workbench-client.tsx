"use client";

import Link from "next/link";
import { useMemo } from "react";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PackageStatusBadge } from "@/components/package-status-badge";
import { FieldStatusBadge, SourceBadge } from "@/components/field-badges";
import { ResolveExceptionDialog } from "@/components/resolve-exception-dialog";
import { useCreatedPackages } from "@/lib/use-created-packages";
import { applyOverrides, usePackageOverrides } from "@/lib/use-package-overrides";
import type { PackageInstance } from "@/lib/types";

export function PackageWorkbenchClient({ id, initialPackage }: { id: string; initialPackage: PackageInstance | null }) {
  const [created] = useCreatedPackages();
  const basePackage = initialPackage ?? created.find((p) => p.id === id) ?? null;

  const { overrides, resolveField, approveAndRelease } = usePackageOverrides(id);
  const pkg = useMemo(() => (basePackage ? applyOverrides(basePackage, overrides) : null), [basePackage, overrides]);

  if (!pkg) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-16 text-center">
        <p className="text-sm text-muted-foreground">Package not found.</p>
        <Link href="/packages" className="text-sm text-primary hover:underline">
          ← Back to packages
        </Link>
      </div>
    );
  }

  const openExceptions = pkg.requirements.filter((r) => r.status !== "Populated");
  const canApprove = openExceptions.length === 0 && pkg.status !== "Released" && pkg.status !== "Approved";
  const canRelease = pkg.status === "Approved";

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <Link href="/packages" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to packages
      </Link>

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              {pkg.project} · {pkg.job}
            </h1>
            <PackageStatusBadge status={pkg.status} />
          </div>
          <div className="text-sm text-muted-foreground">
            {pkg.phase} · {pkg.release} · {pkg.packageType} · Planner: {pkg.planner}
          </div>
        </div>
        <div className="flex gap-2">
          {canApprove ? (
            <Button
              onClick={() => {
                approveAndRelease(pkg.planner, false);
                toast.success("Package approved");
              }}
            >
              Approve
            </Button>
          ) : null}
          {canRelease ? (
            <Button
              onClick={() => {
                approveAndRelease(pkg.planner, true);
                toast.success("Package released to shop");
              }}
            >
              Release to shop
            </Button>
          ) : null}
          {pkg.status === "Released" ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-success/12 px-3 py-1.5 text-sm font-medium text-success">
              <CheckCircle2 className="size-4" /> Released {pkg.releasedAt}
            </span>
          ) : null}
        </div>
      </div>

      {openExceptions.length > 0 ? (
        <Card className="border-warning/30 bg-warning/10 py-3">
          <CardContent className="flex items-start gap-2.5 px-4 text-sm">
            <Info className="mt-0.5 size-4 shrink-0 text-warning" />
            {openExceptions.length} field{openExceptions.length === 1 ? "" : "s"} need planner attention before this
            package can be approved. AI proposes and assists — it does not authorize release on its own.
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Requirements ({pkg.requirements.filter((r) => r.status === "Populated").length}/{pkg.requirements.length}{" "}
            populated)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="px-4 py-2 font-normal">Document / field</th>
                  <th className="px-4 py-2 font-normal">Source system</th>
                  <th className="px-4 py-2 font-normal">Status</th>
                  <th className="px-4 py-2 font-normal">Origin</th>
                  <th className="px-4 py-2 text-right font-normal">Confidence</th>
                  <th className="px-4 py-2 font-normal" />
                </tr>
              </thead>
              <tbody>
                {pkg.requirements.map((r) => (
                  <tr key={r.id} className="border-b border-border/60 last:border-0">
                    <td className="px-4 py-3">
                      {r.name}
                      {!r.required ? <span className="ml-1.5 text-xs text-muted-foreground">(conditional)</span> : null}
                      {r.note ? <div className="text-xs text-muted-foreground">{r.note}</div> : null}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{r.sourceSystem}</td>
                    <td className="px-4 py-3">
                      <FieldStatusBadge status={r.status} />
                    </td>
                    <td className="px-4 py-3">
                      <SourceBadge source={r.source} />
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                      {Math.round(r.confidence * 100)}%
                    </td>
                    <td className="px-4 py-3 text-right">
                      {r.status !== "Populated" && pkg.status !== "Released" ? (
                        <ResolveExceptionDialog requirement={r} onResolve={(note) => resolveField(r.id, pkg.planner, note)} />
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">History &amp; evidence</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {pkg.history.map((h, i) => (
              <li key={i} className="flex items-center justify-between gap-4">
                <span>{h.event}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {h.timestamp} · {h.actor}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
