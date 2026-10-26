"use client";

import { useState, useTransition } from "react";

import { Loader2, Pencil, Trash2 } from "lucide-react";
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
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Team, Tournament, TournamentStatusTransition } from "@/lib/api/types";
import { formatDate, formatDateTime } from "@/lib/format";
import {
  changeTournamentStatusAction,
  deleteTournamentAction,
  updateTournamentAction,
} from "@/server/actions/championships";

import {
  championshipStatusLabel,
  championshipStatusVariant,
  tournamentTypeLabel,
} from "./championship-labels";

interface ChampionshipDetailsCardProps {
  tournament: Tournament;
  /** Equipas ativas — referência repassada pelo cartão-mãe. */
  teams: Team[];
  onChanged: (tournament: Tournament) => void;
  /** Chamado após a exclusão — a lista remove a linha e move a seleção. */
  onDeleted: (tournamentId: number) => void;
}

interface ChampionshipTransition {
  label: string;
  next: TournamentStatusTransition;
  variant: "default" | "outline" | "destructive";
}

/** Transições de estado disponíveis por estado atual (PATCH /tournaments/:id/status). */
const STATUS_TRANSITIONS: Partial<Record<string, ReadonlyArray<ChampionshipTransition>>> = {
  DRAFT: [{ label: "Abrir inscrições", next: "REGISTRATION_OPEN", variant: "outline" }],
  REGISTRATION_OPEN: [
    { label: "Fechar inscrições", next: "REGISTRATION_CLOSED", variant: "outline" },
    { label: "Cancelar campeonato", next: "CANCELLED", variant: "destructive" },
  ],
  REGISTRATION_CLOSED: [
    { label: "Reabrir inscrições", next: "REGISTRATION_OPEN", variant: "outline" },
    { label: "Iniciar campeonato", next: "IN_PROGRESS", variant: "default" },
    { label: "Cancelar campeonato", next: "CANCELLED", variant: "destructive" },
  ],
  IN_PROGRESS: [
    { label: "Concluir campeonato", next: "FINISHED", variant: "default" },
    { label: "Cancelar campeonato", next: "CANCELLED", variant: "destructive" },
  ],
};

/**
 * Ficha do campeonato: dados, regras e ciclo de vida — edição (PUT), transições
 * de estado (PATCH status) e exclusão (bloqueada pela API quando há dependências).
 */
export function ChampionshipDetailsCard({ tournament, onChanged, onDeleted }: ChampionshipDetailsCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [name, setName] = useState(tournament.name);
  const [description, setDescription] = useState(tournament.description ?? "");
  const [nameError, setNameError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  /** Transição em curso — mostra o Loader2 apenas no botão premido. */
  const [pendingNext, setPendingNext] = useState<TournamentStatusTransition | null>(null);

  const editDisabled = tournament.status === "IN_PROGRESS";
  const transitions = STATUS_TRANSITIONS[tournament.status] ?? [];

  function handleSave() {
    if (name.trim().length < 3) {
      setNameError("Informe o nome do campeonato.");
      return;
    }
    setNameError(null);
    const trimmedDescription = description.trim();
    startTransition(async () => {
      const result = await updateTournamentAction(tournament.id, {
        name: name.trim(),
        description: trimmedDescription === "" ? undefined : trimmedDescription,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Campeonato atualizado.");
      onChanged(result.data);
      setEditOpen(false);
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteTournamentAction(tournament.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Campeonato eliminado.");
      onDeleted(tournament.id);
    });
  }

  function handleStatusChange(next: TournamentStatusTransition) {
    setPendingNext(next);
    startTransition(async () => {
      try {
        const result = await changeTournamentStatusAction(tournament.id, next);
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        toast.success(`Estado atual: ${championshipStatusLabel(result.data.status)}.`);
        onChanged(result.data);
      } finally {
        setPendingNext(null);
      }
    });
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs">Nome</p>
          <p className="font-medium text-sm">{tournament.name}</p>
        </div>
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs">Tipo</p>
          <p className="font-medium text-sm">{tournamentTypeLabel(tournament.type)}</p>
        </div>
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs">Estado</p>
          <Badge variant={championshipStatusVariant(tournament.status)}>
            {championshipStatusLabel(tournament.status)}
          </Badge>
        </div>
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs">Período</p>
          <p className="font-medium text-sm">
            {`${formatDate(tournament.period.startDate)} – ${formatDate(tournament.period.endDate)}`}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs">Descrição</p>
          <p className="font-medium text-sm">{tournament.description ?? "—"}</p>
        </div>
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs">Criado em</p>
          <p className="font-medium text-sm">{formatDateTime(tournament.createdAt)}</p>
        </div>
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs">ID</p>
          <p className="font-medium text-sm tabular-nums">{tournament.id}</p>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-muted-foreground text-xs">Regras</p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="space-y-1">
            <p className="text-muted-foreground text-xs">Equipas</p>
            <p className="font-medium text-sm tabular-nums">
              {`${tournament.rules.minTeams}–${tournament.rules.maxTeams}`}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground text-xs">Empates</p>
            <p className="font-medium text-sm">{tournament.rules.allowDraws ? "Permitidos" : "Não permitidos"}</p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground text-xs">Pontos (V/E/D)</p>
            <p className="font-medium text-sm tabular-nums">
              {`${tournament.rules.pointsPerWin}/${tournament.rules.pointsPerDraw}/${tournament.rules.pointsPerLoss}`}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
        <Button size="sm" variant="outline" disabled={isPending || editDisabled} onClick={() => setEditOpen(true)}>
          <Pencil /> Editar
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="sm" variant="destructive">
              <Trash2 /> Eliminar
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Eliminar campeonato {tournament.name}?</AlertDialogTitle>
              <AlertDialogDescription>
                Se o campeonato tiver inscrições, classificação ou jogos associados, a API bloqueia a eliminação —
                nesse caso cancele-o.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction disabled={isPending} onClick={handleDelete}>
                {isPending && <Loader2 className="animate-spin" data-icon="inline-start" />}
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        {editDisabled ? (
          <p className="text-muted-foreground text-xs">O campeonato em curso não pode ser editado.</p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
        {transitions.length > 0 ? (
          transitions.map((action) => (
            <Button
              key={action.next}
              size="sm"
              variant={action.variant}
              disabled={isPending}
              onClick={() => handleStatusChange(action.next)}
            >
              {pendingNext === action.next && <Loader2 className="animate-spin" data-icon="inline-start" />}
              {action.label}
            </Button>
          ))
        ) : (
          <p className="text-muted-foreground text-sm">Sem ações disponíveis neste estado.</p>
        )}
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar campeonato</DialogTitle>
            <DialogDescription>Alterações aplicadas via PUT /tournaments na API.</DialogDescription>
          </DialogHeader>
          <FieldGroup className="gap-4">
            <Field data-invalid={Boolean(nameError)}>
              <FieldLabel htmlFor="edit-championship-name">Nome</FieldLabel>
              <Input
                id="edit-championship-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                aria-invalid={Boolean(nameError)}
              />
              {nameError && <FieldError errors={[{ message: nameError }]} />}
            </Field>
            <Field>
              <FieldLabel htmlFor="edit-championship-description">Descrição</FieldLabel>
              <Textarea
                id="edit-championship-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" disabled={isPending} onClick={handleSave}>
              {isPending && <Loader2 className="animate-spin" data-icon="inline-start" />}
              {isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
