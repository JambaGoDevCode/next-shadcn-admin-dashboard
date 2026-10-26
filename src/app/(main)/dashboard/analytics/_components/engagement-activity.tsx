import { Ellipsis } from "lucide-react";

import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AnalyticsFeatures } from "@/lib/api/types";

import { HBarChart } from "./hbar-chart";

const FEATURE_LABELS: Record<string, string> = {
  bookings: "Reservas",
  matches: "Partidas",
  matchmaking: "Matchmaking",
  payments: "Pagamentos",
  registrations: "Inscrições",
  tournaments: "Torneios",
};

interface EngagementActivityProps {
  data: AnalyticsFeatures | null;
  days: number;
  failed: boolean;
}

/** Ações criadas por funcionalidade no período. */
export function EngagementActivity({ data, days, failed }: EngagementActivityProps) {
  const chartData = [...(data?.features ?? [])]
    .sort((a, b) => b.current - a.current || a.key.localeCompare(b.key))
    .map((feature) => ({
      label: FEATURE_LABELS[feature.key] ?? feature.key,
      value: feature.current,
      display: `${feature.current} · ${feature.total}`,
    }));

  return (
    <Card className="h-full gap-2">
      <CardHeader>
        <CardTitle className="font-normal">Atividade por funcionalidade</CardTitle>
        <CardAction>
          <Ellipsis className="size-4" />
        </CardAction>
      </CardHeader>
      <CardDescription className="px-6">
        Ações criadas nos últimos {days} dias (período · total acumulado).
      </CardDescription>

      <CardContent>
        {failed ? (
          <div className="flex h-64 flex-col items-center justify-center gap-2 text-center">
            <p className="font-medium text-red-700 text-sm dark:text-red-300">Não foi possível carregar a atividade.</p>
            <p className="text-red-700/80 text-xs dark:text-red-300/80">Verifique se a API está em execução.</p>
          </div>
        ) : (
          <HBarChart data={chartData} emptyText="Sem ações no período selecionado." />
        )}
      </CardContent>
    </Card>
  );
}
