"use client";

import { type ReactNode, useCallback, useEffect, useState, useTransition } from "react";

import { ListChecks, Loader2, RefreshCw, RotateCcw } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Team, TournamentStanding } from "@/lib/api/types";
import { createTeamLabeler } from "@/lib/format";
import { cn } from "@/lib/utils";
import { calculateStandingsAction, listStandingsAction, resetStandingsAction } from "@/server/actions/championships";

interface ChampionshipStandingsCardProps {
  tournamentId: number;
  /** Equipas ativas — rótulos das linhas da tabela. */
  teams: Team[];
}

/**
 * Classificação do campeonato (GET /tournament-standings/:id) — calcular a
 * tabela a partir dos resultados e repor, com recarga independente.
 */
export function ChampionshipStandingsCard({ tournamentId, teams }: ChampionshipStandingsCardProps) {
  const [rows, setRows] = useState<TournamentStanding[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  // Transições separadas — calcular e repor não desativam um ao outro.
  const [calcPending, startCalcTransition] = useTransition();
  const [resetPending, startResetTransition] = useTransition();

  const refresh = useCallback(() => setRefreshKey((value) => value + 1), []);

  // Classificação — recarrega no mount, a cada refreshKey e quando o campeonato muda.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    listStandingsAction(tournamentId)
      .then((result) => {
        if (cancelled) return;
        if (result.ok) {
          setRows(result.data);
          setError(null);
        } else {
          setRows(null);
          setError(result.error);
        }
      })
      .catch(() => {
        if (cancelled) return;
        setRows(null);
        setError("Não foi possível carregar a classificação.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [tournamentId, refreshKey]);

  const teamLabel = createTeamLabeler(teams);
  const sortedRows = rows ? [...rows].sort((a, b) => a.position - b.position) : [];

  function handleCalculate() {
    startCalcTransition(async () => {
      const result = await calculateStandingsAction(tournamentId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setRows(result.data);
      setError(null);
      toast.success("Classificação calculada.");
    });
  }

  function handleReset() {
    startResetTransition(async () => {
      const result = await resetStandingsAction(tournamentId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setRows([]);
      setError(null);
      toast.success("Classificação reposta.");
    });
  }

  let body: ReactNode;
  if (loading && !rows) {
    body = (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton className="h-10 w-full" key={index} />
        ))}
      </div>
    );
  } else if (error) {
    body = (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-8 text-center">
        <p className="text-destructive text-sm">{error}</p>
        <Button onClick={refresh} size="sm" variant="outline">
          Tentar novamente
        </Button>
      </div>
    );
  } else if (sortedRows.length === 0) {
    body = (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ListChecks />
          </EmptyMedia>
          <EmptyTitle>Sem classificação</EmptyTitle>
          <EmptyDescription>Use «Calcular classificação» para gerar a tabela com base nos resultados.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  } else {
    body = (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">#</TableHead>
            <TableHead>Equipa</TableHead>
            <TableHead className="text-right">J</TableHead>
            <TableHead className="text-right">V</TableHead>
            <TableHead className="text-right">E</TableHead>
            <TableHead className="text-right">D</TableHead>
            <TableHead className="text-right">GM</TableHead>
            <TableHead className="text-right">GC</TableHead>
            <TableHead className="text-right">PTS</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedRows.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="tabular-nums">{row.position}</TableCell>
              <TableCell className="font-medium">{teamLabel(row.teamId)}</TableCell>
              <TableCell className="text-right tabular-nums">{row.played}</TableCell>
              <TableCell className="text-right tabular-nums">{row.wins}</TableCell>
              <TableCell className="text-right tabular-nums">{row.draws}</TableCell>
              <TableCell className="text-right tabular-nums">{row.losses}</TableCell>
              <TableCell className="text-right tabular-nums">{row.goalsFor}</TableCell>
              <TableCell className="text-right tabular-nums">{row.goalsAgainst}</TableCell>
              <TableCell className="text-right font-medium tabular-nums">{row.points}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button disabled={calcPending} onClick={handleCalculate} size="sm">
          {calcPending && <Loader2 className="animate-spin" data-icon="inline-start" />}
          Calcular classificação
        </Button>

        <div className="flex flex-wrap items-center gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                disabled={!rows || rows.length === 0 || resetPending}
                size="sm"
                variant="outline"
              >
                <RotateCcw /> Repor
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Repor classificação?</AlertDialogTitle>
                <AlertDialogDescription>
                  Isto apaga a classificação calculada deste campeonato.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction disabled={resetPending} onClick={handleReset}>
                  {resetPending && <Loader2 className="animate-spin" data-icon="inline-start" />}
                  Repor
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button
            aria-label="Recarregar classificação"
            disabled={loading}
            onClick={refresh}
            size="icon-sm"
            variant="ghost"
          >
            <RefreshCw className={cn("size-4", loading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {body}
    </div>
  );
}
