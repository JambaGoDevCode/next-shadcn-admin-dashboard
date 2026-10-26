"use client";

import * as React from "react";

import { Loader2, Trash2, UserPlus, X } from "lucide-react";
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { DepartmentItem, MemberInfo } from "@/lib/api/types";
import { plural } from "@/lib/format";
import {
  addMemberAction,
  createDepartmentAction,
  deleteDepartmentAction,
  removeMemberAction,
  updateDepartmentAction,
} from "@/server/actions/productivity";

interface DepartmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** `null` cria um departamento; caso contrário edita e gere os membros. */
  department: DepartmentItem | null;
  /** Catálogo de utilizadores ativos (para escolher membros). */
  catalog: MemberInfo[];
  /**
   * Chamado após cada gravação: `updated` mantém o diálogo aberto em
   * modo edição (após criar, devolve o departamento completo);
   * `null` fecha (remoção concluída).
   */
  onSaved: (updated: DepartmentItem | null) => void;
}

/**
 * Diálogo de criação/edição de departamentos — os "projetos" do
 * layout original — com gestão de membros da equipa.
 */
export function DepartmentDialog({ open, onOpenChange, department, catalog, onSaved }: DepartmentDialogProps) {
  const isEdit = department !== null;

  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [members, setMembers] = React.useState<MemberInfo[]>([]);
  const [newMemberId, setNewMemberId] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [memberBusy, setMemberBusy] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;

    setError(null);
    setNewMemberId("");

    if (department) {
      setName(department.name);
      setDescription(department.description ?? "");
      setMembers(department.members);
    } else {
      setName("");
      setDescription("");
      setMembers([]);
    }
  }, [department, open]);

  const available = catalog.filter((user) => !members.some((member) => member.id === user.id));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (name.trim().length < 2) {
      setError("O nome deve ter pelo menos 2 caracteres.");
      return;
    }

    setSaving(true);
    setError(null);

    const input = { name: name.trim(), description: description.trim() ? description.trim() : null };
    const result = department
      ? await updateDepartmentAction(department.id, input)
      : await createDepartmentAction(input);
    setSaving(false);

    if (result.ok) {
      toast.success(department ? "Departamento atualizado." : "Departamento criado. Agora adicione os membros.");
      onSaved(result.data ?? null);
      return;
    }

    setError(result.error);
  };

  const handleAddMember = async () => {
    if (!department || !newMemberId) return;

    setMemberBusy(true);
    const userId = Number(newMemberId);
    const result = await addMemberAction(department.id, userId);
    setMemberBusy(false);

    if (result.ok) {
      const user = catalog.find((entry) => entry.id === userId);
      if (user) {
        setMembers((current) => [...current, user].sort((a, b) => a.name.localeCompare(b.name)));
      }
      setNewMemberId("");
      toast.success("Membro adicionado.");
      onSaved(department);
      return;
    }

    toast.error(result.error);
  };

  const handleRemoveMember = async (userId: number) => {
    if (!department) return;

    setMemberBusy(true);
    const result = await removeMemberAction(department.id, userId);
    setMemberBusy(false);

    if (result.ok) {
      setMembers((current) => current.filter((member) => member.id !== userId));
      toast.success("Membro removido.");
      onSaved(department);
      return;
    }

    toast.error(result.error);
  };

  const handleDelete = async () => {
    if (!department) return;

    setSaving(true);
    const result = await deleteDepartmentAction(department.id);
    setSaving(false);
    setConfirmDelete(false);

    if (result.ok) {
      toast.success("Departamento removido.");
      onSaved(null);
      return;
    }

    toast.error(result.error);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{isEdit ? "Gerir departamento" : "Novo departamento"}</DialogTitle>
            <DialogDescription>
              {isEdit
                ? "Edite os dados, acompanhe o progresso e gere os membros da equipa."
                : "Crie um departamento e adicione depois os membros da equipa."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error ? (
              <p
                role="alert"
                className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-destructive text-sm"
              >
                {error}
              </p>
            ) : null}

            <div className="flex flex-col gap-2">
              <Label htmlFor="department-name">Nome</Label>
              <Input
                id="department-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ex.: Operações"
                maxLength={80}
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="department-description">Descrição</Label>
              <Input
                id="department-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="O que trata este departamento?"
                maxLength={500}
              />
            </div>

            {isEdit && department ? (
              <>
                <p className="text-muted-foreground text-xs">
                  {department.taskCount} {plural(department.taskCount, "tarefa", "tarefas")} ·{" "}
                  {department.doneTaskCount} concluída
                  {department.doneTaskCount === 1 ? "" : "s"}
                </p>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <Label>Membros da equipa</Label>
                    <span className="text-muted-foreground text-xs">
                      {members.length} {plural(members.length, "membro", "membros")}
                    </span>
                  </div>

                  {members.length === 0 ? (
                    <p className="rounded-md border border-dashed px-3 py-2 text-muted-foreground text-sm">
                      Sem membros — adicione alguém para poder atribuir tarefas.
                    </p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {members.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between gap-2 rounded-md border px-3 py-2"
                        >
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium">{member.name}</div>
                            <div className="truncate text-muted-foreground text-xs">{member.email}</div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-7 shrink-0 text-muted-foreground"
                            aria-label={`Remover ${member.name}`}
                            disabled={memberBusy}
                            onClick={() => handleRemoveMember(member.id)}
                          >
                            <X className="size-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Select value={newMemberId} onValueChange={setNewMemberId} disabled={available.length === 0}>
                      <SelectTrigger className="flex-1" aria-label="Selecionar utilizador">
                        <SelectValue
                          placeholder={available.length > 0 ? "Selecionar utilizador…" : "Todos já são membros"}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {available.map((user) => (
                            <SelectItem key={user.id} value={String(user.id)}>
                              {user.name} — {user.email}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddMember}
                      disabled={!newMemberId || memberBusy}
                    >
                      <UserPlus data-icon="inline-start" />
                      Adicionar
                    </Button>
                  </div>
                </div>
              </>
            ) : null}

            <div className="flex items-center justify-between gap-2">
              {isEdit && department ? (
                <Button type="button" variant="destructive" onClick={() => setConfirmDelete(true)} disabled={saving}>
                  <Trash2 data-icon="inline-start" />
                  Excluir
                </Button>
              ) : (
                <span />
              )}
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? <Loader2 data-icon="inline-start" className="animate-spin" /> : null}
                  {isEdit ? "Guardar" : "Criar departamento"}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover departamento?</AlertDialogTitle>
            <AlertDialogDescription>
              «{department?.name}» e as suas {department?.taskCount ?? 0}{" "}
              {plural(department?.taskCount ?? 0, "tarefa", "tarefas")} serão removidas. Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
