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
import type { City, RecentUser, Team } from "@/lib/api/types";
import { createCityLabeler, formatDateTime } from "@/lib/format";
import { deleteTeamAction, updateTeamAction } from "@/server/actions/management";

import { createOwnerLabeler } from "./team-labels";

interface TeamDetailsCardProps {
  team: Team;
  /** Cidades ativas — usadas para rotular a cidade da equipa. */
  cities: City[];
  /** Utilizadores recentes — usados para rotular o proprietário. */
  users: RecentUser[];
  onChanged: (team: Team) => void;
  /** Chamado após a exclusão — a lista remove a linha e move a seleção. */
  onDeleted: (teamId: number) => void;
}

export function TeamDetailsCard({ team, cities, users, onChanged, onDeleted }: TeamDetailsCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [name, setName] = useState(team.name);
  const [description, setDescription] = useState(team.description ?? "");
  const [logo, setLogo] = useState(team.logo ?? "");
  const [nameError, setNameError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const cityLabel = createCityLabeler(cities);
  const ownerLabel = createOwnerLabeler(users);

  function handleSave() {
    if (name.trim().length < 3) {
      setNameError("O nome deve ter pelo menos 3 caracteres.");
      return;
    }
    setNameError(null);
    startTransition(async () => {
      const trimmedDescription = description.trim();
      const trimmedLogo = logo.trim();
      const result = await updateTeamAction(team.id, {
        name: name.trim(),
        description: trimmedDescription === "" ? undefined : trimmedDescription,
        logo: trimmedLogo === "" ? undefined : trimmedLogo,
      });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Equipa atualizada.");
      onChanged(result.data);
      setEditOpen(false);
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteTeamAction(team.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Equipa eliminada.");
      onDeleted(team.id);
    });
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs">Nome</p>
          <p className="font-medium text-sm">{team.name}</p>
        </div>
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs">Descrição</p>
          <p className="font-medium text-sm">{team.description ?? "—"}</p>
        </div>
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs">Cidade</p>
          <p className="font-medium text-sm">{cityLabel(team.cityId)}</p>
        </div>
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs">Proprietário</p>
          <p className="font-medium text-sm">{ownerLabel(team.ownerId)}</p>
        </div>
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs">Logótipo</p>
          <p className="break-all font-medium text-sm">{team.logo ?? "—"}</p>
        </div>
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs">Criado em</p>
          <p className="font-medium text-sm">{formatDateTime(team.createdAt)}</p>
        </div>
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs">Atualizado em</p>
          <p className="font-medium text-sm">{formatDateTime(team.updatedAt)}</p>
        </div>
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs">ID</p>
          <p className="font-medium text-sm tabular-nums">{team.id}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
        <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
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
              <AlertDialogTitle>Eliminar equipa {team.name}?</AlertDialogTitle>
              <AlertDialogDescription>
                A API faz um soft delete: a equipa deixa de aparecer nas listagens.
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
            <DialogTitle>Editar equipa</DialogTitle>
            <DialogDescription>Alterações aplicadas via PUT /teams na API.</DialogDescription>
          </DialogHeader>
          <FieldGroup className="gap-4">
            <Field data-invalid={Boolean(nameError)}>
              <FieldLabel htmlFor="edit-team-name">Nome</FieldLabel>
              <Input
                id="edit-team-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                aria-invalid={Boolean(nameError)}
              />
              {nameError && <FieldError errors={[{ message: nameError }]} />}
            </Field>
            <Field>
              <FieldLabel htmlFor="edit-team-description">Descrição</FieldLabel>
              <Textarea
                id="edit-team-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="edit-team-logo">Logótipo (URL)</FieldLabel>
              <Input id="edit-team-logo" type="url" value={logo} onChange={(event) => setLogo(event.target.value)} />
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
