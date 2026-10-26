"use client";

import { useState, useTransition } from "react";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
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
import type { AdminUser } from "@/lib/api/types";
import { profileTypeLabel } from "@/lib/format";
import { deleteUserAction, setUserActiveAction, updateUserAction } from "@/server/actions/users";

import { userStatusLabel, userStatusVariant } from "./user-labels";

function formatDate(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return format(date, "dd/MM/yyyy HH:mm", { locale: ptBR });
}

interface UserDetailsCardProps {
  user: AdminUser;
  onChanged: (user: AdminUser) => void;
  onDeleted: () => void;
}

export function UserDetailsCard({ user, onChanged, onDeleted }: UserDetailsCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [nameError, setNameError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    if (name.trim().length < 2) {
      setNameError("Informe o nome completo.");
      return;
    }
    setNameError(null);
    startTransition(async () => {
      const result = await updateUserAction(user.id, { name: name.trim(), email: email.trim() });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Usuário atualizado.");
      onChanged(result.data);
      setEditOpen(false);
    });
  }

  function handleToggleStatus() {
    startTransition(async () => {
      const activate = user.status !== "ACTIVE";
      const result = await setUserActiveAction(user.id, activate);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(activate ? "Usuário ativado." : "Usuário desativado.");
      onChanged(result.data);
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteUserAction(user.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Usuário removido (soft delete).");
      onDeleted();
    });
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs">Nome</p>
          <p className="font-medium text-sm">{user.name}</p>
        </div>
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs">E-mail</p>
          <p className="font-medium text-sm">{user.email}</p>
        </div>
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs">Tipo</p>
          <p className="font-medium text-sm">{user.type ? profileTypeLabel(user.type) : "—"}</p>
        </div>
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs">Status</p>
          <Badge variant={userStatusVariant(user.status)}>{userStatusLabel(user.status)}</Badge>
        </div>
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs">E-mail verificado</p>
          <p className="font-medium text-sm">{user.emailVerifiedAt ? formatDate(user.emailVerifiedAt) : "Não"}</p>
        </div>
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs">Último login</p>
          <p className="font-medium text-sm">{formatDate(user.lastLoginAt)}</p>
        </div>
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs">Criado em</p>
          <p className="font-medium text-sm">{formatDate(user.createdAt)}</p>
        </div>
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs">ID</p>
          <p className="font-medium text-sm tabular-nums">{user.id}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
        <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
          <Pencil /> Editar
        </Button>
        <Button size="sm" variant="outline" disabled={isPending} onClick={handleToggleStatus}>
          {isPending && <Loader2 className="animate-spin" />}
          {user.status === "ACTIVE" ? "Desativar" : "Ativar"}
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="sm" variant="destructive">
              <Trash2 /> Excluir
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir usuário {user.email}?</AlertDialogTitle>
              <AlertDialogDescription>
                A API faz um soft delete: o usuário será desativado e não fará mais login.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <p className="text-muted-foreground text-xs">
        Palavras-passe: os administradores não podem alterá-las nem consultar credenciais — a recuperação é feita pelo
        próprio utilizador no fluxo seguro de autenticação («Esqueci-me da palavra-passe»).
      </p>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar usuário</DialogTitle>
            <DialogDescription>Alterações de nome e e-mail são aplicadas pela API.</DialogDescription>
          </DialogHeader>
          <FieldGroup className="gap-4">
            <Field data-invalid={Boolean(nameError)}>
              <FieldLabel htmlFor="edit-user-name">Nome</FieldLabel>
              <Input
                id="edit-user-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                aria-invalid={Boolean(nameError)}
              />
              {nameError && <FieldError errors={[{ message: nameError }]} />}
            </Field>
            <Field>
              <FieldLabel htmlFor="edit-user-email">E-mail</FieldLabel>
              <Input
                id="edit-user-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
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
