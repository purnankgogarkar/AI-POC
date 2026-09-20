"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, UploadCloud } from "lucide-react";
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
import { StatusBadge } from "@/components/status-badge";
import { useUploadedInvoices } from "@/lib/use-uploaded-invoices";
import { generateInvoices } from "@/lib/generate-invoices";
import { cn } from "@/lib/utils";
import type { Invoice } from "@/lib/types";

const STAGES = [
  "Extracting header & line items",
  "Resolving jurisdiction",
  "Classifying line items",
  "Determining & comparing tax",
  "Flagging results",
] as const;

type Phase = "idle" | "running" | "done";

export function UploadInvoiceDialog() {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [stageIndex, setStageIndex] = useState(0);
  const [result, setResult] = useState<Invoice | null>(null);
  const [, addInvoice] = useUploadedInvoices();
  const router = useRouter();
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  function reset() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setPhase("idle");
    setStageIndex(0);
    setResult(null);
  }

  function runPipeline() {
    setPhase("running");
    setStageIndex(0);

    STAGES.forEach((_, i) => {
      const t = setTimeout(() => setStageIndex(i), i * 550);
      timers.current.push(t);
    });

    const finalTimer = setTimeout(() => {
      const [invoice] = generateInvoices(1, Date.now() ^ Math.floor(Math.random() * 1e9));
      addInvoice(invoice);
      setResult(invoice);
      setPhase("done");
    }, STAGES.length * 550);
    timers.current.push(finalTimer);
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
            <UploadCloud className="size-4" /> Upload invoice
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload an invoice</DialogTitle>
          <DialogDescription>
            This prototype simulates document extraction rather than running real OCR — dropping any file triggers
            the pipeline below and produces a new synthesized result.
          </DialogDescription>
        </DialogHeader>

        {phase === "idle" ? (
          <button
            type="button"
            onClick={runPipeline}
            className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border p-10 text-center transition-colors hover:border-primary/50 hover:bg-accent/40"
          >
            <UploadCloud className="size-8 text-muted-foreground" />
            <div className="text-sm font-medium">Drop a file here, or click to simulate an upload</div>
            <div className="text-xs text-muted-foreground">PDF, PNG, or JPG — content is not actually read</div>
          </button>
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
                {result.vendorName} · {result.invoiceNumber}
              </span>
              <StatusBadge status={result.status} />
            </div>
            <div className="text-xs text-muted-foreground">
              {result.lineItems.length} line item{result.lineItems.length === 1 ? "" : "s"} processed
            </div>
          </div>
        ) : null}

        <DialogFooter>
          {phase === "done" && result ? (
            <>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Close
              </Button>
              <Button
                onClick={() => {
                  setOpen(false);
                  router.push(`/invoices/${result.id}`);
                }}
              >
                View invoice
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
