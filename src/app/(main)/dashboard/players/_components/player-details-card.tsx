"use client";

import { useState, useTransition } from "react";

import { Loader2, Pencil, Shield, Trash2 } from "lucide-react";
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
import type { City, Player, Team } from "@/lib/api/types";
import { createCityLabeler, createTeamLabeler, formatDate, playerPositionLabel } from "@/lib/format";
import {
  deletePlayerAction,
  promoteCaptainAction,
  removeCaptainAction,
  updatePlayerAction,
} from "@/server/actions/players";

interface PlayerDetailsCardProps {
  player: Player;
  /** Equipas ativas — rótulo da equipa do jogador. */
  teams: Team[];
  /** Cidades ativas — rótulo da cidade do jogador. */
  cities: City[];
  onChanged: (player: Player) => void;
  /** Chamado após a exclusão — a lista remove a linha e move a seleção. */
  onDeleted: (playerId: string) => void;
  /** Chamado após alterar a capitania — a lista é recarregada. */
  onCaptainChanged: () => void;
}

/**
 * Ficha do jogador: dados, estatísticas e ações — edição (PUT), capitania
 * (promote/remove) e exclusão definitiva (hard delete na API).
 */
export function PlayerDetailsCard({
  player,
  teams,
  cities,
  onChanged,
  onDeleted,
  onCaptainChanged,
}: PlayerDetailsCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [fullName, setFullName] = useState(player.fullName);
  const [nickname, setNickname] = useState(player.nickname ?? "");
  const [jersey, setJersey] = useState(String(player.jerseyNumber ?? ""));
  const [fullNameError, setFullNameError] = useState<string | null>(null);
  const [jerseyError, setJerseyError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const teamLabel = createTeamLabeler(teams);
  const cityLabel = createCityLabeler(cities);

  function handleSave() {
    const jerseyNumber = Number(jersey.trim());
    if (fullName.trim().length < 3) {
      setFullNameError("Informe o nome completo.");
      return;
    }
    setFullNameError(null);
    if (!Number.isInteger(jerseyNumber) || jerseyNumber < 1 || jerseyNumber > 99) {
      setJerseyError("Número entre 1 e 99.");
      return;
    }
    setJerseyError(null);

    const trimmedFullName = fullName.trim();
    const trimmedNickname = nickname.trim();
    startTransition(async () => {
      const result = await updatePlayerAction(player.id, {
        fullName: trimmedFullName,
        nickname: trimmedNickname,
        jerseyNumber,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Jogador atualizado.");
      // A API não devolve o jogador atualizado — mesclamos localmente.
      onChanged({
        ...player,
        fullName: trimmedFullName,
        nickname: trimmedNickname === "" ? null : trimmedNickname,
        jerseyNumber,
      });
      setEditOpen(false);
    });
  }

  function handleCaptainToggle() {
    startTransition(async () => {
      const result = player.isCaptain
        ? await removeCaptainAction(player.id)
        : await promoteCaptainAction(player.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(
        player.isCaptain
          ? `Capitania removida de ${player.fullName}.`
          : `${player.fullName} agora é capitão.`,
      );
      onCaptainChanged();
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deletePlayerAction(player.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Jogador eliminado.");
      onDeleted(player.id);
    });
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs">Nome completo</p>
          <p className="font-medium text-sm">{player.fullName}</p>
        </div>
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs">Apelido</p>
          <p className="font-medium text-sm">{player.nickname ?? "—"}</p>
        </div>
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs">Posição</p>
          <p className="font-medium text-sm">{playerPositionLabel(player.position)}</p>
        </div>
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs">Número</p>
          <p className="font-medium text-sm tabular-nums">{`#${player.jerseyNumber ?? "—"}`}</p>
        </div>
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs">Data de nascimento</p>
          <p className="font-medium text-sm">{formatDate(player.birthDate)}</p>
        </div>
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs">Equipa</p>
          <p className="font-medium text-sm">{teamLabel(player.teamId)}</p>
        </div>
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs">Cidade</p>
          <p className="font-medium text-sm">{cityLabel(player.cityId)}</p>
        </div>
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs">Estado</p>
          <Badge variant={player.isActive ? "default" : "secondary"}>
            {player.isActive ? "Ativo" : "Inativo"}
          </Badge>
        </div>
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs">Capitão</p>
          <p className="font-medium text-sm">{player.isCaptain ? "Sim" : "Não"}</p>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-muted-foreground text-xs">Estatísticas</p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="space-y-1">
            <p className="text-muted-foreground text-xs">Jogos</p>
            <p className="font-medium text-sm tabular-nums">{player.matchesPlayed ?? 0}</p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground text-xs">Golos</p>
            <p className="font-medium text-sm tabular-nums">{player.goals ?? 0}</p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground text-xs">Assistências</p>
            <p className="font-medium text-sm tabular-nums">{player.assists ?? 0}</p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground text-xs">Cartões amarelos</p>
            <p className="font-medium text-sm tabular-nums">{player.yellowCards ?? 0}</p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground text-xs">Cartões vermelhos</p>
            <p className="font-medium text-sm tabular-nums">{player.redCards ?? 0}</p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground text-xs">Defesas sem sofrer</p>
            <p className="font-medium text-sm tabular-nums">{player.cleanSheets ?? 0}</p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground text-xs">MVPs</p>
            <p className="font-medium text-sm tabular-nums">{player.mvpAwards ?? 0}</p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground text-xs">Minutos</p>
            <p className="font-medium text-sm tabular-nums">{player.minutesPlayed ?? 0}</p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-muted-foreground text-xs">Avaliação</p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="space-y-1">
            <p className="text-muted-foreground text-xs">Ataque</p>
            <p className="font-medium text-sm tabular-nums">{player.rating?.attack ?? "—"}</p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground text-xs">Defesa</p>
            <p className="font-medium text-sm tabular-nums">{player.rating?.defense ?? "—"}</p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground text-xs">Passe</p>
            <p className="font-medium text-sm tabular-nums">{player.rating?.passing ?? "—"}</p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground text-xs">Ritmo</p>
            <p className="font-medium text-sm tabular-nums">{player.rating?.speed ?? "—"}</p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground text-xs">Resistência</p>
            <p className="font-medium text-sm tabular-nums">{player.rating?.stamina ?? "—"}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
        <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
          <Pencil /> Editar
        </Button>
        <Button size="sm" variant="outline" disabled={isPending} onClick={handleCaptainToggle}>
          {isPending ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Shield />}
          {player.isCaptain ? "Remover capitão" : "Tornar capitão"}
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="sm" variant="destructive">
              <Trash2 /> Eliminar
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Eliminar jogador {player.fullName}?</AlertDialogTitle>
              <AlertDialogDescription>
                Atenção: a API faz eliminação definitiva (hard delete) — o jogador será removido da base de dados sem
                reversão.
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
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar jogador</DialogTitle>
            <DialogDescription>
              A API só permite editar nome, apelido e número — posição e data de nascimento são imutáveis.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup className="gap-4">
            <Field data-invalid={Boolean(fullNameError)}>
              <FieldLabel htmlFor="edit-player-full-name">Nome completo</FieldLabel>
              <Input
                id="edit-player-full-name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                aria-invalid={Boolean(fullNameError)}
              />
              {fullNameError && <FieldError errors={[{ message: fullNameError }]} />}
            </Field>
            <Field>
              <FieldLabel htmlFor="edit-player-nickname">Apelido</FieldLabel>
              <Input
                id="edit-player-nickname"
                value={nickname}
                onChange={(event) => setNickname(event.target.value)}
              />
            </Field>
            <Field data-invalid={Boolean(jerseyError)}>
              <FieldLabel htmlFor="edit-player-jersey-number">Número</FieldLabel>
              <Input
                id="edit-player-jersey-number"
                type="number"
                min={1}
                max={99}
                value={jersey}
                onChange={(event) => setJersey(event.target.value)}
                aria-invalid={Boolean(jerseyError)}
              />
              {jerseyError && <FieldError errors={[{ message: jerseyError }]} />}
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
