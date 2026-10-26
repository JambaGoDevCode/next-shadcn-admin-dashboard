"use client";

import * as React from "react";

import { Ban, CalendarClock, Loader2, MoreHorizontal, Pencil, Play, Square, Trash2 } from "lucide-react";
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
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MatchStatus, type MatchSimple } from "@/lib/api/types";
import type { LogisticsActionResult } from "@/server/actions/logistics";
import { cancelMatchAction, deleteMatchAction, finishMatchAction, startMatchAction } from "@/server/actions/logistics";

interface MatchLifecycleActionsProps {
  match: MatchSimple;
  /** A lista/detalhe deve ser recarregado após uma alteração de estado. */
  onChanged: () => void;
  /** A partida foi eliminada — a seleção atual deve ser limpa. */
  onDeleted: () => void;
  onOpenScore: () => void;
  onOpenReschedule: () => void;
}

type PendingAction = "start" | "finish" | "cancel" | "delete" | null;

/**
 * Ações de ciclo de vida da partida («mais opções» do template):
 * iniciar, finalizar, atualizar placar, reagendar, cancelar e eliminar.
 */
export function MatchLifecycleActions({
  match,
  onChanged,
  onDeleted,
  onOpenScore,
  onOpenReschedule,
}: MatchLifecycleActionsProps) {
  const [pending, setPending] = React.useState<PendingAction>(null);
  const [cancelOpen, setCancelOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  const canStart =
    match.status === MatchStatus.SCHEDULED ||
    match.status === MatchStatus.CONFIRMED ||
    match.status === MatchStatus.POSTPONED;
  const canLive = match.status === MatchStatus.LIVE;
  const canDelete = match.status !== MatchStatus.LIVE;
  const hasOptionsMenu = canStart || canDelete;

  async function run(
    kind: Exclude<PendingAction, null>,
    action: () => Promise<LogisticsActionResult<unknown>>,
    success: string,
    after?: () => void,
  ) {
    if (pending !== null) return;
    setPending(kind);

    const result = await action();
    setPending(null);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(success);
    after?.();
  }

  function handleCancelConfirm() {
    void run(
      "cancel",
      () => cancelMatchAction(match.id),
      "Partida cancelada.",
      () => {
        setCancelOpen(false);
        onChanged();
      },
    );
  }

  function handleDeleteConfirm() {
    void run(
      "delete",
      () => deleteMatchAction(match.id),
      "Partida eliminada.",
      () => {
        setDeleteOpen(false);
        onDeleted();
      },
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {canStart ? (
        <Button
          disabled={pending !== null}
          onClick={() => void run("start", () => startMatchAction(match.id), "Partida iniciada.", onChanged)}
          size="sm"
        >
          {pending === "start" ? <Loader2 className="animate-spin" /> : <Play />}
          Iniciar
        </Button>
      ) : null}

      {canLive ? (
        <>
          <Button disabled={pending !== null} onClick={onOpenScore} size="sm">
            <Pencil />
            Placar
          </Button>
          <Button
            disabled={pending !== null}
            onClick={() => void run("finish", () => finishMatchAction(match.id), "Partida finalizada.", onChanged)}
            size="sm"
            variant="outline"
          >
            {pending === "finish" ? <Loader2 className="animate-spin" /> : <Square />}
            Finalizar
          </Button>
        </>
      ) : null}

      {hasOptionsMenu ? (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button aria-label="Mais opções da partida" disabled={pending !== null} size="icon-sm" variant="outline">
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {canStart ? (
                <DropdownMenuItem onClick={onOpenReschedule}>
                  <CalendarClock className="size-4" />
                  Reagendar
                </DropdownMenuItem>
              ) : null}
              {canStart ? (
                <DropdownMenuItem onClick={() => setCancelOpen(true)}>
                  <Ban className="size-4" />
                  Cancelar partida
                </DropdownMenuItem>
              ) : null}
              {canDelete ? (
                <DropdownMenuItem className="text-destructive" onClick={() => setDeleteOpen(true)}>
                  <Trash2 className="size-4" />
                  Eliminar
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>

          <AlertDialog onOpenChange={setCancelOpen} open={cancelOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cancelar partida #{match.id}?</AlertDialogTitle>
                <AlertDialogDescription>
                  {match.homeTeamName} vs {match.awayTeamName} ficará com o estado «Cancelada».
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Voltar</AlertDialogCancel>
                <AlertDialogAction disabled={pending !== null} onClick={handleCancelConfirm}>
                  {pending === "cancel" ? <Loader2 className="animate-spin" /> : null}
                  Confirmar cancelamento
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog onOpenChange={setDeleteOpen} open={deleteOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Eliminar partida #{match.id}?</AlertDialogTitle>
                <AlertDialogDescription>
                  {match.homeTeamName} vs {match.awayTeamName} deixa de aparecer nas listas — a API faz soft delete e
                  mantém o registo inativo.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Voltar</AlertDialogCancel>
                <AlertDialogAction disabled={pending !== null} onClick={handleDeleteConfirm}>
                  {pending === "delete" ? <Loader2 className="animate-spin" /> : null}
                  Eliminar partida
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      ) : null}
    </div>
  );
}
