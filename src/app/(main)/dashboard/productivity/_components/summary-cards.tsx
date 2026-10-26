import { isToday } from "date-fns";
import { ArrowRight, Clock3, Focus, TrendingUp } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TaskItem } from "@/lib/api/types";
import { plural } from "@/lib/format";

interface SummaryCardsProps {
  tasks: TaskItem[];
}

/**
 * Indicadores do topo: tarefas para hoje, progresso geral e trabalho
 * em curso — calculados sobre as tarefas reais da API.
 */
export function SummaryCards({ tasks }: SummaryCardsProps) {
  const total = tasks.length;
  const done = tasks.filter((task) => task.status === "DONE").length;
  const inProgress = tasks.filter((task) => task.status === "IN_PROGRESS").length;
  const dueToday = tasks.filter(
    (task) => task.status !== "DONE" && task.dueDate !== null && isToday(new Date(task.dueDate)),
  ).length;
  const progressPct = total === 0 ? 0 : Math.round((done / total) * 100);

  const summaryCards = [
    {
      title: "Hoje",
      value: String(dueToday),
      description: plural(dueToday, "tarefa para hoje", "tarefas para hoje"),
      icon: Clock3,
    },
    {
      title: "Progresso",
      value: `${progressPct}%`,
      description: `${done} de ${total} concluídas`,
      icon: TrendingUp,
    },
    {
      title: "Foco",
      value: String(inProgress),
      description: plural(inProgress, "tarefa em curso", "tarefas em curso"),
      icon: Focus,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {summaryCards.map((item) => (
        <Card key={item.title} className="shadow-xs">
          <CardHeader>
            <CardTitle>
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <div className="grid size-7 place-items-center rounded-lg border bg-muted">
                  <item.icon className="size-4" />
                </div>
                {item.title}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <div className="text-2xl leading-none tracking-tight">{item.value}</div>
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground tabular-nums leading-none">{item.description}</p>
                <ArrowRight className="size-4 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
