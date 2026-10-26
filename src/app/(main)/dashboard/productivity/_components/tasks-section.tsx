"use client";

import { format, isToday, isTomorrow, startOfDay } from "date-fns";
import { Calendar1, Flag, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { TaskItem, TaskStatus } from "@/lib/api/types";
import { statusTone, taskPriorityLabel, taskStatusLabel } from "@/lib/format";

export type TaskStatusFilter = "all" | TaskStatus;

interface TasksSectionProps {
  tasks: TaskItem[];
  statusFilter: TaskStatusFilter;
  onStatusFilterChange: (value: TaskStatusFilter) => void;
  onNewTask: () => void;
  onEditTask: (task: TaskItem) => void;
  onToggleStatus: (task: TaskItem) => void;
}

const STATUS_FILTER_LABELS: Record<TaskStatusFilter, string> = {
  all: "Todos os estados",
  DONE: "Concluídas",
  IN_PROGRESS: "Em andamento",
  IN_REVIEW: "Em revisão",
  TODO: "A fazer",
};

function dueMeta(task: TaskItem): { label: string; overdue: boolean } {
  if (!task.dueDate) return { label: "Sem prazo", overdue: false };

  const due = new Date(task.dueDate);
  const overdue = task.status !== "DONE" && startOfDay(due).getTime() < startOfDay(new Date()).getTime();

  if (isToday(due)) return { label: "Hoje", overdue };
  if (isTomorrow(due)) return { label: "Amanhã", overdue };
  return { label: format(due, "dd/MM"), overdue };
}

/**
 * Lista de tarefas com filtro de estado, marcação rápida (checkbox) e
 * abertura do diálogo de edição — mantém o design original da página.
 */
export function TasksSection({
  tasks,
  statusFilter,
  onStatusFilterChange,
  onNewTask,
  onEditTask,
  onToggleStatus,
}: TasksSectionProps) {
  return (
    <section id="tarefas" className="flex scroll-mt-6 flex-col gap-2">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl tracking-tight">Tarefas</h2>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={(value) => onStatusFilterChange(value as TaskStatusFilter)}>
            <SelectTrigger className="w-40" aria-label="Filtrar por estado">
              <SelectValue placeholder="Todos os estados" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {(Object.keys(STATUS_FILTER_LABELS) as TaskStatusFilter[]).map((value) => (
                  <SelectItem key={value} value={value}>
                    {STATUS_FILTER_LABELS[value]}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <Button onClick={onNewTask}>
            <Plus data-icon="inline-start" />
            Nova tarefa
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-background shadow-xs">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
            <p className="text-muted-foreground text-sm">Nenhuma tarefa neste estado.</p>
            <Button variant="outline" size="sm" onClick={onNewTask}>
              <Plus data-icon="inline-start" />
              Criar tarefa
            </Button>
          </div>
        ) : (
          <div className="divide-y">
            {tasks.map((task) => {
              const { label: dueLabel, overdue } = dueMeta(task);
              const urgent = task.priority === "URGENT" || task.priority === "HIGH";

              return (
                <div key={task.id} className="flex items-center gap-2 p-4">
                  <Checkbox
                    checked={task.status === "DONE"}
                    aria-label={`Concluir ${task.title}`}
                    onCheckedChange={() => onToggleStatus(task)}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex min-w-0 flex-col gap-2 lg:flex-row lg:items-center lg:gap-4">
                        <span className="flex min-w-0 items-center gap-1.5">
                          <Flag
                            aria-hidden
                            title={taskPriorityLabel(task.priority)}
                            className={`size-3.5 shrink-0 ${
                              urgent ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"
                            } ${task.priority === "URGENT" ? "fill-current" : ""}`}
                          />
                          <button
                            type="button"
                            onClick={() => onEditTask(task)}
                            className="truncate text-left text-sm hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            {task.title}
                          </button>
                        </span>
                        <Badge variant="outline" className="px-3 py-1 font-normal">
                          {task.departmentName ?? "—"}
                        </Badge>
                        <Badge variant="outline" className={`px-3 py-1 font-normal ${statusTone(task.status)}`}>
                          {taskStatusLabel(task.status)}
                        </Badge>
                      </div>
                      <div className="flex shrink-0 items-center gap-3 text-muted-foreground text-sm">
                        <span className="hidden max-w-32 truncate lg:inline">
                          {task.assigneeName ?? "Sem responsável"}
                        </span>
                        <span className={overdue ? "font-medium text-destructive" : undefined}>{dueLabel}</span>
                        <Calendar1 className="size-4" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
