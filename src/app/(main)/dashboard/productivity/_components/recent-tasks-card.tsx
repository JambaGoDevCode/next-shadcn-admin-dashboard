import { format, isToday, isYesterday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TaskItem } from "@/lib/api/types";

interface RecentTasksCardProps {
  tasks: TaskItem[];
}

function formatTaskDate(iso: string): string {
  const date = new Date(iso);
  if (isToday(date)) return "Hoje";
  if (isYesterday(date)) return "Ontem";
  return format(date, "d MMM", { locale: ptBR });
}

/**
 * As tarefas mais recentes (sidebar) — mesmo layout do card de notas
 * do template, agora com dados reais.
 */
export function RecentTasksCard({ tasks }: RecentTasksCardProps) {
  const recent = [...tasks]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);

  return (
    <Card className="shadow-xs">
      <CardHeader>
        <CardTitle>Tarefas recentes</CardTitle>
        <CardAction>
          <Button variant="ghost" size="sm" className="text-muted-foreground" asChild>
            <a href="#tarefas">Ver todas</a>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {recent.length === 0 ? (
          <p className="text-muted-foreground text-sm">Sem tarefas criadas ainda.</p>
        ) : (
          recent.map((task) => (
            <div key={task.id} className="flex items-start gap-4">
              <FileText className="size-5 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <div className="truncate font-medium text-sm leading-none">{task.title}</div>
                <div className="text-muted-foreground text-xs">{formatTaskDate(task.createdAt)}</div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
