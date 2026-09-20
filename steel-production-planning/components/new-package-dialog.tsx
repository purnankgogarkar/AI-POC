"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { PackageStatusBadge } from "@/components/package-status-badge";
import { useCreatedPackages } from "@/lib/use-created-packages";
import { generateNewDraftPackage, PROJECTS } from "@/lib/generate-packages";
import { PACKAGE_TYPES, type PackageInstance, type PackageType } from "@/lib/types";
import { cn } from "@/lib/utils";

// The Production Readiness Layer's six operations, per the brief.
const STAGES = ["Gather", "Normalize", "Determine requirements", "Pre-populate", "Validate", "Flag"] as const;

type Phase = "config" | "running" | "done";

export function NewPackageDialog() {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>("config");
  const [project, setProject] = useState<string>(PROJECTS[0]);
  const [packageType, setPackageType] = useState<PackageType>(PACKAGE_TYPES[0]);
  const [stageIndex, setStageIndex] = useState(0);
  const [result, setResult] = useState<PackageInstance | null>(null);
  const [, addPackage] = useCreatedPackages();
  const router = useRouter();
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  function reset() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setPhase("config");
    setStageIndex(0);
    setResult(null);
  }

  function runPipeline() {
    setPhase("running");
    setStageIndex(0);

    STAGES.forEach((_, i) => {
      timers.current.push(setTimeout(() => setStageIndex(i), i * 500));
    });

    timers.current.push(
      setTimeout(() => {
        const pkg = generateNewDraftPackage(project, packageType, Date.now() ^ Math.floor(Math.random() * 1e9));
        addPackage(pkg);
        setResult(pkg);
        setPhase("done");
      }, STAGES.length * 500)
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger
        render={
          <Button>
            <Plus className="size-4" /> New package
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Generate a draft package</DialogTitle>
          <DialogDescription>
            Select the context. The system gathers available information, applies rules and AI pre-population, and
            flags what still needs a planner.
          </DialogDescription>
        </DialogHeader>

        {phase === "config" ? (
          <div className="space-y-4 py-1">
            <div className="space-y-1.5">
              <Label>Project</Label>
              <Select value={project} onValueChange={(v) => v && setProject(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue>{() => project}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {PROJECTS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Package type</Label>
              <Select value={packageType} onValueChange={(v) => v && setPackageType(v as PackageType)}>
                <SelectTrigger className="w-full">
                  <SelectValue>{() => packageType}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {PACKAGE_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : (
          <div className="space-y-3 py-2">
            {STAGES.map((stage, i) => {
              const state = phase === "done" || i < stageIndex ? "done" : i === stageIndex ? "active" : "pending";
              return (
                <div key={stage} className="flex items-center gap-3 text-sm">
                  {state === "done" ? (
                    <CheckCircle2 className="size-4 shrink-0 text-success" />
                  ) : state === "active" ? (
                    <Loader2 className="size-4 shrink-0 animate-spin text-primary" />
                  ) : (
                    <span className="size-4 shrink-0 rounded-full border border-border" />
                  )}
                  <span className={cn(state === "pending" && "text-muted-foreground")}>{stage}</span>
                </div>
              );
            })}
          </div>
        )}

        {phase === "done" && result ? (
          <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="font-medium">
                {result.project} · {result.job}
              </span>
              <PackageStatusBadge status={result.status} />
            </div>
            <div className="text-xs text-muted-foreground">
              {result.requirements.length} requirements pre-populated
              {result.originalExceptionCount > 0 ? ` · ${result.originalExceptionCount} flagged for review` : ""}
            </div>
          </div>
        ) : null}

        <DialogFooter>
          {phase === "config" ? (
            <>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={runPipeline}>Generate draft package</Button>
            </>
          ) : phase === "done" && result ? (
            <>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Close
              </Button>
              <Button
                onClick={() => {
                  setOpen(false);
                  router.push(`/packages/${result.id}`);
                }}
              >
                Open workbench
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
