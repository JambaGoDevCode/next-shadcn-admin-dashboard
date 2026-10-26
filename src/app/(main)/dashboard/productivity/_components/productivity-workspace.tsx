"use client";

import * as React from "react";

import { useRouter } from "next/navigation";

import { format } from "date-fns";
import { toast } from "sonner";

import type { DepartmentItem, MemberInfo, TaskItem, TaskStatus } from "@/lib/api/types";
import { taskPriorityLabel, taskStatusLabel } from "@/lib/format";
import { updateTaskAction } from "@/server/actions/productivity";

import { DepartmentDialog } from "./department-dialog";
import { ProjectsSection } from "./projects-section";
import { QuickActions } from "./quick-actions";
import { SummaryCards } from "./summary-cards";
import { TaskDialog } from "./task-dialog";
import { type TaskStatusFilter, TasksSection } from "./tasks-section";

interface ProductivityWorkspaceProps {
  departments: DepartmentItem[];
  tasks: TaskItem[];
  catalog: MemberInfo[];
}

/**
 * Coluna principal da página de gestão de tarefas: mantém o estado
 * partilhado entre secções (filtros e diálogos de CRUD) — os dados
 * chegam do servidor na página e são recarregados com `router.refresh()`.
 */
export function ProductivityWorkspace({ departments, tasks, catalog }: ProductivityWorkspaceProps) {
  const router = useRouter();

  const [statusFilter, setStatusFilter] = React.useState<TaskStatusFilter>("all");
  const [taskDialog, setTaskDialog] = React.useState<{ open: boolean; task: TaskItem | null }>({
    open: false,
    task: null,
  });
  const [deptDialog, setDeptDialog] = React.useState<{ open: boolean; department: DepartmentItem | null }>({
    open: false,
    department: null,
  });
  const [togglingId, setTogglingId] = React.useState<number | null>(null);

  const visibleTasks = statusFilter === "all" ? tasks : tasks.filter((task) => task.status === statusFilter);

  const openTaskDialog = (task: TaskItem | null) => setTaskDialog({ open: true, task });
  const openDeptDialog = (department: DepartmentItem | null) => setDeptDialog({ open: true, department });

  const closeTasksAndRefresh = () => {
    setTaskDialog({ open: false, task: null });
    router.refresh();
  };

  /** Marca/desmarca a tarefa como concluída (checkbox da lista). */
  const handleToggleStatus = async (task: TaskItem) => {
    if (togglingId !== null) return;

    setTogglingId(task.id);
    const next: TaskStatus = task.status === "DONE" ? "TODO" : "DONE";
    const result = await updateTaskAction(task.id, { status: next });
    setTogglingId(null);

    if (result.ok) {
      toast.success(next === "DONE" ? "Tarefa concluída." : "Tarefa reaberta.");
      router.refresh();
      return;
    }

    toast.error(result.error);
  };

  /** Aplica um filtro rápido e desliza para a lista de tarefas. */
  const handleQuickFilter = (status: TaskStatus) => {
    setStatusFilter(status);
    document.getElementById("tarefas")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  /** Exporta todas as tarefas em CSV (separador `;`, com BOM p/ Excel). */
  const handleExportCsv = () => {
    const header = ["Título", "Departamento", "Estado", "Prioridade", "Responsável", "Vencimento", "Criada em"];
    const rows = tasks.map((task) => [
      task.title,
      task.departmentName ?? "",
      taskStatusLabel(task.status),
      taskPriorityLabel(task.priority),
      task.assigneeName ?? "",
      task.dueDate ? format(new Date(task.dueDate), "dd/MM/yyyy") : "",
      format(new Date(task.createdAt), "dd/MM/yyyy"),
    ]);

    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(";"))
      .join("\r\n");

    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `tarefas-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast.success("Lista de tarefas exportada.");
  };

  const handleDeptSaved = (updated: DepartmentItem | null) => {
    router.refresh();

    if (updated) {
      setDeptDialog({ open: true, department: updated });
    } else {
      setDeptDialog({ open: false, department: null });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <SummaryCards tasks={tasks} />

      <TasksSection
        tasks={visibleTasks}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onNewTask={() => openTaskDialog(null)}
        onEditTask={openTaskDialog}
        onToggleStatus={handleToggleStatus}
      />

      <ProjectsSection departments={departments} onNew={() => openDeptDialog(null)} onEdit={openDeptDialog} />

      <QuickActions
        onNewTask={() => openTaskDialog(null)}
        onNewDepartment={() => openDeptDialog(null)}
        onFilter={handleQuickFilter}
        onExportCsv={handleExportCsv}
      />

      <TaskDialog
        open={taskDialog.open}
        onOpenChange={(open) => setTaskDialog((current) => ({ ...current, open }))}
        task={taskDialog.task}
        departments={departments}
        onSaved={closeTasksAndRefresh}
      />

      <DepartmentDialog
        open={deptDialog.open}
        onOpenChange={(open) => setDeptDialog((current) => ({ ...current, open }))}
        department={deptDialog.department}
        catalog={catalog}
        onSaved={handleDeptSaved}
      />
    </div>
  );
}
