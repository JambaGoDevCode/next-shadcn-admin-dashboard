"use client";

import * as React from "react";

import { Building2, ClipboardCheck, Globe, Orbit, Pencil, Plus, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { DepartmentItem } from "@/lib/api/types";
import { plural } from "@/lib/format";

const departmentIcons = [Orbit, Globe, ClipboardCheck, Building2, Users] as const;

type DepartmentFilter = "todos" | "curso" | "concluidos";

const FILTER_LABELS: Record<DepartmentFilter, string> = {
  todos: "Todos",
  curso: "Em curso",
  concluidos: "Concluídos",
};

interface ProjectsSectionProps {
  departments: DepartmentItem[];
  onNew: () => void;
  onEdit: (department: DepartmentItem) => void;
}

/**
 * Grelha de departamentos (os "projetos" do layout original) com
 * membros, progresso de tarefas e acesso à gestão (edição/remoção).
 */
export function ProjectsSection({ departments, onNew, onEdit }: ProjectsSectionProps) {
  const [filter, setFilter] = React.useState<DepartmentFilter>("todos");

  const visible = departments.filter((department) => {
    if (filter === "curso") return department.taskCount > 0 && department.doneTaskCount < department.taskCount;
    if (filter === "concluidos") return department.taskCount > 0 && department.doneTaskCount === department.taskCount;
    return true;
  });

  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl tracking-tight">Departamentos</h2>
        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={(value) => setFilter(value as DepartmentFilter)}>
            <SelectTrigger className="w-32" aria-label="Filtrar departamentos">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {(Object.keys(FILTER_LABELS) as DepartmentFilter[]).map((value) => (
                  <SelectItem key={value} value={value}>
                    {FILTER_LABELS[value]}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={onNew}>
            <Plus data-icon="inline-start" />
            Novo
          </Button>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground text-sm">
          Nenhum departamento com estes critérios.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {visible.map((department, index) => {
            const Icon = departmentIcons[index % departmentIcons.length];
            const progress =
              department.taskCount === 0 ? 0 : Math.round((department.doneTaskCount / department.taskCount) * 100);

            return (
              <Card
                key={department.id}
                className="shadow-xs transition-colors hover:bg-accent/40"
                onClick={() => onEdit(department)}
              >
                <CardHeader>
                  <CardTitle className="min-w-0">
                    <div className="flex min-w-0 items-center gap-2">
                      <Icon className="size-4 shrink-0 text-muted-foreground" />
                      <span className="truncate">{department.name}</span>
                    </div>
                  </CardTitle>
                  <CardAction>
                    <Badge variant="outline">
                      {department.memberCount} {plural(department.memberCount, "membro", "membros")}
                    </Badge>
                  </CardAction>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-1">
                    <div className="text-sm leading-none">{department.description ?? "Sem descrição."}</div>
                    <div className="flex items-center gap-3">
                      <Progress value={progress} className="h-2" />
                      <span className="shrink-0 text-sm">{progress}%</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="justify-between py-2.5">
                  <span className="text-muted-foreground">
                    {department.doneTaskCount} de {department.taskCount}{" "}
                    {plural(department.taskCount, "tarefa", "tarefas")}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-muted-foreground"
                    aria-label={`Gerir ${department.name}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      onEdit(department);
                    }}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
