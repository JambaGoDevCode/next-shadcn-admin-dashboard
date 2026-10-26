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
import { updateMatchScoreAction } from "@/server/actions/logistics";

interface MatchScoreDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  match: MatchSimple | null;
  onSaved: () => void;
}

/** Diálogo «Placar» — atualiza os golos das equipas (PATCH /matches/:id/score). */
export function MatchScoreDialog({ open, onOpenChange, match, onSaved }: MatchScoreDialogProps) {
  const [homeScore, setHomeScore] = React.useState("0");
  const [awayScore, setAwayScore] = React.useState("0");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!open || !match) return;
    setHomeScore(String(match.homeScore ?? 0));
    setAwayScore(String(match.awayScore ?? 0));
    setSaving(false);
  }, [open, match]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (saving || !match) return;

    const home = Number(homeScore);
    const away = Number(awayScore);

    if (!Number.isInteger(home) || home < 0 || !Number.isInteger(away) || away < 0) {
      toast.error("O placar deve usar números inteiros não negativos.");
      return;
    }

    setSaving(true);
    const result = await updateMatchScoreAction(match.id, home, away);
    setSaving(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success("Placar atualizado.");
    onSaved();
    onOpenChange(false);
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Atualizar placar</DialogTitle>
          <DialogDescription>
            {match ? `${match.homeTeamName} vs ${match.awayTeamName}` : "Defina os golos de cada equipa."}
          </DialogDescription>
        </DialogHeader>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="score-home">Golos da mandante</Label>
              <Input
                autoFocus
                id="score-home"
                min={0}
                onChange={(event) => setHomeScore(event.target.value)}
                step={1}
                type="number"
                value={homeScore}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="score-away">Golos da visitante</Label>
              <Input
                id="score-away"
                min={0}
                onChange={(event) => setAwayScore(event.target.value)}
                step={1}
                type="number"
                value={awayScore}
              />
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
              Cancelar
            </Button>
            <Button disabled={saving} type="submit">
              {saving ? <Loader2 className="animate-spin" /> : null}
              Guardar placar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
