"use client";

import { CheckSquare, ClipboardCheck, Download, Focus, Orbit } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { TaskStatus } from "@/lib/api/types";

interface QuickActionsProps {
  onNewTask: () => void;
  onNewDepartment: () => void;
  onFilter: (status: TaskStatus) => void;
  onExportCsv: () => void;
}

/**
 * Atalhos rápidos: criar tarefa/departamento, saltar para filtros de
 * estado e exportar a lista de tarefas em CSV.
 */
export function QuickActions({ onNewTask, onNewDepartment, onFilter, onExportCsv }: QuickActionsProps) {
  const quickActions = [
    { label: "Nova tarefa", icon: CheckSquare, onClick: onNewTask },
    { label: "Novo departamento", icon: Orbit, onClick: onNewDepartment },
    { label: "Em andamento", icon: Focus, onClick: () => onFilter("IN_PROGRESS") },
    { label: "Concluídas", icon: ClipboardCheck, onClick: () => onFilter("DONE") },
    { label: "Exportar CSV", icon: Download, onClick: onExportCsv },
  ];

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-xl tracking-tight">Ações rápidas</h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {quickActions.map((action) => (
          <Button
            key={action.label}
            variant="outline"
            className="h-auto min-h-8 justify-start whitespace-normal text-left"
            onClick={action.onClick}
          >
            <action.icon data-icon="inline-start" />
            {action.label}
          </Button>
        ))}
      </div>
    </section>
  );
}
