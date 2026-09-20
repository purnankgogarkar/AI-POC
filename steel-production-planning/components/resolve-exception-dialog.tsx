"use client";

import { useState } from "react";
import { Wrench } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import type { RequirementItem } from "@/lib/types";

export function ResolveExceptionDialog({
  requirement,
  onResolve,
}: {
  requirement: RequirementItem;
  onResolve: (note: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            <Wrench className="size-3.5" /> Resolve
          </Button>
        }
      />
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Resolve: {requirement.name}</DialogTitle>
          <DialogDescription>
            {requirement.status === "Conflict" && requirement.conflictValues
              ? `Conflicting values found: "${requirement.conflictValues[0]}" vs. "${requirement.conflictValues[1]}". Confirm the correct value.`
              : `Status: ${requirement.status}. Add a note on how this was resolved.`}
          </DialogDescription>
        </DialogHeader>
        <Textarea
          placeholder="e.g. Verified against the latest drawing revision and confirmed with the shop."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            disabled={!note.trim()}
            onClick={() => {
              onResolve(note.trim());
              setOpen(false);
              setNote("");
            }}
          >
            Confirm resolution
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
