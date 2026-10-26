"use client";

import * as React from "react";

import { CalendarPlus, Loader2, Swords } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { MatchmakingRecommendationRow } from "@/lib/api/types";
import {
  acceptMatchmakingAction,
  findMatchmakingAction,
  getMatchmakingRecommendationsAction,
  rejectMatchmakingAction,
} from "@/server/actions/logistics";

import { useMatchReference } from "./use-match-reference";

interface MatchmakingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Abre o «Marcar jogo» com as equipas do convite aceite. */
  onSchedule: (homeTeamId: number, awayTeamId: number) => void;
}

function strategyLabel(strategy: string): string {
  if (strategy === "auto") return "Automático";
  return strategy;
}

/**
 * Diálogo de matchmaking — procura adversários para uma equipa (POST /matchmaking/find),
 * lista as recomendações persistidas e permite aceitar ou rejeitar cada uma.
 */
export function MatchmakingDialog({ open, onOpenChange, onSchedule }: MatchmakingDialogProps) {
  const { data: reference, loading: loadingReference, error: referenceError, retry } = useMatchReference(open);

  const [teamId, setTeamId] = React.useState("");
  const [rows, setRows] = React.useState<MatchmakingRecommendationRow[] | null>(null);
  const [rowsLoading, setRowsLoading] = React.useState(false);
  const [rowsError, setRowsError] = React.useState<string | null>(null);
  const [rowsAttempt, setRowsAttempt] = React.useState(0);
  const [searching, setSearching] = React.useState(false);
  const [actingId, setActingId] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (!open) {
      setTeamId("");
      setRows(null);
      setRowsError(null);
      setSearching(false);
      setActingId(null);
      return;
    }
    if (!teamId) {
      setRows(null);
      setRowsError(null);
    }
  }, [open, teamId]);

  React.useEffect(() => {
    if (!open || !teamId) return;

    let cancelled = false;
    setRowsLoading(true);
    setRowsError(null);

    getMatchmakingRecommendationsAction(Number(teamId))
      .then((result) => {
        if (cancelled) return;
        if (result.ok) {
          setRows(result.data);
        } else {
          setRows(null);
          setRowsError(result.error);
        }
      })
      .catch(() => {
        if (cancelled) return;
        setRows(null);
        setRowsError("Não foi possível carregar as recomendações.");
      })
      .finally(() => {
        if (!cancelled) setRowsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, teamId, rowsAttempt]);

  const reloadRows = React.useCallback(() => setRowsAttempt((value) => value + 1), []);

  async function handleFind() {
    if (!teamId || searching) return;

    setSearching(true);
    const result = await findMatchmakingAction(Number(teamId));
    setSearching(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    if (result.data.length === 0) {
      toast.info("Nenhum adversário compatível encontrado.");
    } else {
      toast.success(
        result.data.length === 1 ? "1 adversário encontrado." : `${result.data.length} adversários encontrados.`,
      );
    }
    reloadRows();
  }

  async function handleAccept(row: MatchmakingRecommendationRow) {
    if (actingId !== null) return;
    setActingId(row.id);

    const result = await acceptMatchmakingAction(row.id);
    setActingId(null);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success("Adversário aceite.");
    reloadRows();
  }

  async function handleReject(row: MatchmakingRecommendationRow) {
    if (actingId !== null) return;
    setActingId(row.id);

    const result = await rejectMatchmakingAction(row.id);
    setActingId(null);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success("Recomendação rejeitada.");
    reloadRows();
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Procurar adversários</DialogTitle>
          <DialogDescription>
            Encontre adversários compatíveis com a sua equipa e aceite ou rejeite cada sugestão.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {loadingReference ? (
            <div className="flex h-24 items-center justify-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="size-4 animate-spin" />
              A carregar equipas…
            </div>
          ) : referenceError ? (
            <div className="flex h-24 flex-col items-center justify-center gap-3 text-center">
              <p className="text-destructive text-sm">{referenceError}</p>
              <Button onClick={retry} size="sm" type="button" variant="outline">
                Tentar novamente
              </Button>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-2">
                <Label htmlFor="matchmaking-team">Equipa</Label>
                <Select onValueChange={setTeamId} value={teamId}>
                  <SelectTrigger id="matchmaking-team">
                    <SelectValue placeholder="Selecionar equipa…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {reference?.teams.map((team) => (
                        <SelectItem key={team.id} value={String(team.id)}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <Button disabled={!teamId || searching} onClick={handleFind} type="button">
                {searching ? <Loader2 className="animate-spin" /> : <Swords />}
                Procurar adversários
              </Button>

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="font-medium text-sm">Recomendações</span>
                  {rows && rows.length > 0 ? (
                    <span className="text-muted-foreground text-xs">{rows.length}</span>
                  ) : null}
                </div>

                {!teamId ? (
                  <p className="rounded-md border border-dashed p-4 text-center text-muted-foreground text-sm">
                    Selecione uma equipa para ver as recomendações.
                  </p>
                ) : rowsLoading ? (
                  <div className="flex h-20 items-center justify-center gap-2 text-muted-foreground text-sm">
                    <Loader2 className="size-4 animate-spin" />
                    A carregar recomendações…
                  </div>
                ) : rowsError ? (
                  <div className="flex h-20 flex-col items-center justify-center gap-2 text-center">
                    <p className="text-destructive text-sm">{rowsError}</p>
                    <Button onClick={reloadRows} size="sm" type="button" variant="outline">
                      Tentar novamente
                    </Button>
                  </div>
                ) : !rows || rows.length === 0 ? (
                  <p className="rounded-md border border-dashed p-4 text-center text-muted-foreground text-sm">
                    Nenhuma recomendação para esta equipa. Use «Procurar adversários» para gerar sugestões.
                  </p>
                ) : (
                  <ul className="flex max-h-60 flex-col gap-2 overflow-y-auto">
                    {rows.map((row) => {
                      const opponent =
                        reference?.teams.find((team) => team.id === row.candidateTeamId)?.name ??
                        `Equipa #${row.candidateTeamId}`;

                      return (
                        <li className="flex flex-wrap items-center gap-2 rounded-md border p-3" key={row.id}>
                          <div className="min-w-0 flex-1">
                            <div className="truncate font-medium text-sm">{opponent}</div>
                            <div className="mt-1 flex flex-wrap items-center gap-1.5">
                              <Badge className="text-[10px]" variant="secondary">
                                {strategyLabel(row.strategy)}
                              </Badge>
                              {row.score > 0 ? (
                                <span className="text-muted-foreground text-xs tabular-nums">
                                  Compatibilidade {row.score}%
                                </span>
                              ) : null}
                            </div>
                          </div>

                          {row.isAccepted ? (
                            <div className="flex items-center gap-2">
                              <Badge className="text-primary" variant="outline">
                                Aceite
                              </Badge>
                              <Button
                                onClick={() => onSchedule(Number(teamId), row.candidateTeamId)}
                                size="sm"
                                type="button"
                                variant="outline"
                              >
                                <CalendarPlus />
                                Marcar jogo
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Button
                                disabled={actingId !== null}
                                onClick={() => handleAccept(row)}
                                size="sm"
                                type="button"
                              >
                                {actingId === row.id ? <Loader2 className="animate-spin" /> : null}
                                Aceitar
                              </Button>
                              <Button
                                disabled={actingId !== null}
                                onClick={() => handleReject(row)}
                                size="sm"
                                type="button"
                                variant="outline"
                              >
                                Rejeitar
                              </Button>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
