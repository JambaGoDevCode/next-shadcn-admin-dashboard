import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { TaskItem } from "@/lib/api/types";

interface WeeklySummaryCardProps {
  tasks: TaskItem[];
}

/**
 * Progresso geral das tarefas (sidebar) — mantém o design do card
 * original com dados reais da API.
 */
export function WeeklySummaryCard({ tasks }: WeeklySummaryCardProps) {
  const total = tasks.length;
  const done = tasks.filter((task) => task.status === "DONE").length;
  const progress = total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <Card className="shadow-xs">
      <CardHeader>
        <CardTitle>Progresso geral</CardTitle>
        <CardAction>
          <Button variant="ghost" size="sm" className="text-muted-foreground" asChild>
            <a href="#tarefas">Ver todas</a>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-muted-foreground">Todas as tarefas dos departamentos.</p>
        <div className="flex flex-col gap-2">
          <div className="font-medium">
            {done} de {total} tarefas concluídas
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
}
