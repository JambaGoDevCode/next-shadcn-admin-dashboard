"use client";

import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Ellipsis } from "lucide-react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import type { GrowthPoint } from "@/lib/api/types";

const chartConfig = {
  newUsers: {
    color: "var(--chart-1)",
    label: "Novos utilizadores",
  },
  activeUsers: {
    color: "var(--chart-2)",
    label: "Utilizadores ativos",
  },
} satisfies ChartConfig;

interface GrowthChartProps {
  points: GrowthPoint[];
  days: number;
  failed: boolean;
  /** "both" — novos + ativos (Audiência); "new" — só registos (Aquisição). */
  series?: "both" | "new";
}

/** Evolução de novos utilizadores e utilizadores ativos por período. */
export function GrowthChart({ points, days, failed, series = "both" }: GrowthChartProps) {
  // Períodos da API são UTC — alinhar "hoje" ao mesmo fuso dos buckets.
  const today = new Date().toISOString().slice(0, 10);

  const chartData = points
    .filter((point) => point.period <= today)
    .map((point) => ({ date: point.period, newUsers: point.newUsers, activeUsers: point.activeUsers }));

  const hasNew = chartData.some((point) => point.newUsers > 0);
  const hasActive = series === "both" && chartData.some((point) => point.activeUsers > 0);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="font-normal">
          {series === "both" ? "Crescimento da audiência" : "Volume de registos"}
        </CardTitle>
        <CardAction>
          <Ellipsis className="size-4" />
        </CardAction>
      </CardHeader>

      <CardContent>
        {failed ? (
          <div className="flex h-68 flex-col items-center justify-center gap-2 text-center">
            <p className="font-medium text-red-700 text-sm dark:text-red-300">Não foi possível carregar a evolução.</p>
            <p className="text-red-700/80 text-xs dark:text-red-300/80">Verifique se a API está em execução.</p>
          </div>
        ) : !hasNew && !hasActive ? (
          <div className="flex h-68 flex-col items-center justify-center gap-2 text-center">
            <p className="text-muted-foreground text-sm">Sem crescimento nos últimos {days} dias.</p>
            <p className="text-muted-foreground/70 text-xs">Os novos registos aparecem aqui assim que ocorrerem.</p>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-68 w-full">
            <LineChart data={chartData} margin={{ bottom: 0, left: 0, right: 0, top: 0 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                axisLine={false}
                interval="preserveStartEnd"
                minTickGap={40}
                tickFormatter={(value: string) => format(parseISO(value), "d/M", { locale: ptBR })}
                tickLine={false}
                tickMargin={14}
              />
              <YAxis
                allowDecimals={false}
                axisLine={false}
                domain={[0, (dataMax: number) => Math.max(dataMax, 1)]}
                tickFormatter={(value) => `${value}`}
                tickLine={false}
                tickMargin={10}
                width={34}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    className="w-48"
                    labelFormatter={(value) =>
                      format(parseISO(value as string), "d 'de' MMMM 'de' yyyy", { locale: ptBR })
                    }
                  />
                }
              />
              <Line
                dataKey="newUsers"
                dot={false}
                activeDot={{ r: 4 }}
                stroke="var(--color-newUsers)"
                strokeWidth={2.5}
                type="linear"
              />
              {series === "both" ? (
                <Line
                  dataKey="activeUsers"
                  dot={false}
                  activeDot={{ r: 4 }}
                  stroke="var(--color-activeUsers)"
                  strokeDasharray="5 4"
                  strokeWidth={2}
                  type="linear"
                />
              ) : null}
            </LineChart>
          </ChartContainer>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-4 text-muted-foreground text-xs">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-4 rounded-full" style={{ background: "var(--chart-1)" }} />
            Novos utilizadores
          </span>
          {series === "both" ? (
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-4 rounded-full" style={{ background: "var(--chart-2)" }} />
              Utilizadores ativos (com reservas ou partidas)
            </span>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
