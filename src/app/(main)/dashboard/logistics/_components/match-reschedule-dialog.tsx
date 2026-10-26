"use client";

import * as React from "react";

import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { MatchSimple } from "@/lib/api/types";
import { rescheduleMatchAction } from "@/server/actions/logistics";

import { defaultFutureDatetimeLocal, isFutureDatetimeLocal, toDatetimeLocalValue } from "./match-date";

interface MatchRescheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  match: MatchSimple | null;
  onSaved: () => void;
}

/** Diálogo «Reagendar» — define nova data/hora (PATCH /matches/:id/reschedule). */
export function MatchRescheduleDialog({ open, onOpenChange, match, onSaved }: MatchRescheduleDialogProps) {
  const [matchDate, setMatchDate] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!open || !match) return;

    const current = match.matchDate ? new Date(match.matchDate) : null;
    setMatchDate(
      current && !Number.isNaN(current.getTime()) && current.getTime() > Date.now()
        ? toDatetimeLocalValue(current)
        : defaultFutureDatetimeLocal(),
    );
    setSaving(false);
  }, [open, match]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (saving || !match) return;

    if (!matchDate) {
      toast.error("Indique a nova data e hora.");
      return;
    }
    if (!isFutureDatetimeLocal(matchDate)) {
      toast.error("A nova data tem de ser no futuro.");
      return;
    }

    setSaving(true);
    const result = await rescheduleMatchAction(match.id, matchDate);
    setSaving(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success("Partida reagendada.");
    onSaved();
    onOpenChange(false);
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Reagendar partida</DialogTitle>
          <DialogDescription>
            {match ? `Partida #${match.id}` : "Escolha a nova data"} — a partida passa ao estado «Adiada».
          </DialogDescription>
        </DialogHeader>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-2">
            <Label htmlFor="reschedule-date">Nova data e hora</Label>
            <Input
              autoFocus
              id="reschedule-date"
              onChange={(event) => setMatchDate(event.target.value)}
              type="datetime-local"
              value={matchDate}
            />
          </div>

          <DialogFooter>
            <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
              Cancelar
            </Button>
            <Button disabled={saving} type="submit">
              {saving ? <Loader2 className="animate-spin" /> : null}
              Reagendar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
