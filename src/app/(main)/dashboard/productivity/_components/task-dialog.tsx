"use client";

import * as React from "react";

import { format } from "date-fns";
import { Loader2, Trash2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import type { DepartmentItem, TaskItem, TaskPriority, TaskStatus } from "@/lib/api/types";
import { createTaskAction, deleteTaskAction, updateTaskAction } from "@/server/actions/productivity";

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** `null` cria uma nova tarefa; caso contrário edita a existente. */
  task: TaskItem | null;
  departments: DepartmentItem[];
  /** Fecha o diálogo e recarrega os dados da página. */
  onSaved: () => void;
}

const STATUS_OPTIONS: Array<{ value: TaskStatus; label: string }> = [
  { value: "TODO", label: "A fazer" },
  { value: "IN_PROGRESS", label: "Em andamento" },
  { value: "IN_REVIEW", label: "Em revisão" },
  { value: "DONE", label: "Concluída" },
];

const PRIORITY_OPTIONS: Array<{ value: TaskPriority; label: string }> = [
  { value: "LOW", label: "Baixa" },
  { value: "MEDIUM", label: "Média" },
  { value: "HIGH", label: "Alta" },
  { value: "URGENT", label: "Urgente" },
];

/**
 * Diálogo de criação/edição de tarefas: título, departamento,
 * responsável (membro do departamento), estado, prioridade e prazo.
 */
export function TaskDialog({ open, onOpenChange, task, departments, onSaved }: TaskDialogProps) {
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [departmentId, setDepartmentId] = React.useState("");
  const [assigneeId, setAssigneeId] = React.useState("");
  const [status, setStatus] = React.useState<TaskStatus>("TODO");
  const [priority, setPriority] = React.useState<TaskPriority>("MEDIUM");
  const [dueDate, setDueDate] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setError(null);

    if (task) {
      setTitle(task.title);
      setDescription(task.description ?? "");
      setDepartmentId(String(task.departmentId));
      setAssigneeId(task.assigneeId !== null ? String(task.assigneeId) : "");
      setStatus(task.status);
      setPriority(task.priority);
      setDueDate(task.dueDate ? format(new Date(task.dueDate), "yyyy-MM-dd") : "");
    } else {
      setTitle("");
      setDescription("");
      setDepartmentId("");
      setAssigneeId("");
      setStatus("TODO");
      setPriority("MEDIUM");
      setDueDate("");
    }
  }, [task, open]);

  const selectedDepartment = departments.find((department) => String(department.id) === departmentId);
  const members = selectedDepartment?.members ?? [];

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (title.trim().length < 2) {
      setError("O título deve ter pelo menos 2 caracteres.");
      return;
    }
    if (!departmentId) {
      setError("Selecione um departamento.");
      return;
    }
    if (!assigneeId) {
      setError("Selecione um responsável (membro do departamento).");
      return;
    }

    setSaving(true);
    setError(null);

    const input = {
      title: title.trim(),
      description: description.trim() ? description.trim() : null,
      status,
      priority,
      dueDate: dueDate || null,
      departmentId: Number(departmentId),
      assigneeId: Number(assigneeId),
    };

    const result = task ? await updateTaskAction(task.id, input) : await createTaskAction(input);
    setSaving(false);

    if (result.ok) {
      toast.success(task ? "Tarefa atualizada." : "Tarefa criada.");
      onSaved();
      return;
    }

    setError(result.error);
  };

  const handleDelete = async () => {
    if (!task) return;

    setSaving(true);
    const result = await deleteTaskAction(task.id);
    setSaving(false);
    setConfirmDelete(false);

    if (result.ok) {
      toast.success("Tarefa removida.");
      onSaved();
      return;
    }

    toast.error(result.error);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{task ? "Editar tarefa" : "Nova tarefa"}</DialogTitle>
            <DialogDescription>
              {task
                ? "Atualize os detalhes da tarefa ou remova-a."
                : "Atribua uma tarefa a um membro da equipa do departamento."}
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
              <Label htmlFor="task-title">Título</Label>
              <Input
                id="task-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Ex.: Atualizar tabela de preços"
                maxLength={150}
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="task-department">Departamento</Label>
                <Select
                  value={departmentId}
                  onValueChange={(value) => {
                    setDepartmentId(value);
                    setAssigneeId("");
                  }}
                >
                  <SelectTrigger id="task-department">
                    <SelectValue placeholder="Selecionar…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {departments.map((department) => (
                        <SelectItem key={department.id} value={String(department.id)}>
                          {department.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="task-assignee">Responsável</Label>
                <Select value={assigneeId} onValueChange={setAssigneeId} disabled={!selectedDepartment}>
                  <SelectTrigger id="task-assignee">
                    <SelectValue
                      placeholder={
                        !selectedDepartment
                          ? "Escolha o departamento"
                          : members.length > 0
                            ? "Selecionar membro…"
                            : "Sem membros"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {members.map((member) => (
                        <SelectItem key={member.id} value={String(member.id)}>
                          {member.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {selectedDepartment && members.length === 0 ? (
                  <p className="text-muted-foreground text-xs">
                    Este departamento ainda não tem membros — adicione-os na gestão do departamento.
                  </p>
                ) : null}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="task-status">Estado</Label>
                <Select value={status} onValueChange={(value) => setStatus(value as TaskStatus)}>
                  <SelectTrigger id="task-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="task-priority">Prioridade</Label>
                <Select value={priority} onValueChange={(value) => setPriority(value as TaskPriority)}>
                  <SelectTrigger id="task-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {PRIORITY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="task-due">Vencimento</Label>
                <Input id="task-due" type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="task-description">Descrição</Label>
              <Textarea
                id="task-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Detalhes, contexto ou passos…"
                rows={3}
                maxLength={2000}
              />
            </div>

            <div className="flex items-center justify-between gap-2">
              {task ? (
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
                  {task ? "Guardar" : "Criar tarefa"}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir tarefa?</AlertDialogTitle>
            <AlertDialogDescription>
              «{task?.title}» será removida permanentemente. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
