"use client";

import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Ellipsis } from "lucide-react";
import { CartesianGrid, ComposedChart, Line, XAxis, YAxis } from "recharts";

import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import type { TimeseriesPoint } from "@/lib/api/types";

const chartConfig = {
  actions: {
    color: "var(--chart-3)",
    label: "Ações no dia",
  },
  average: {
    color: "var(--muted-foreground)",
    label: "Média do período",
  },
} satisfies ChartConfig;

interface TrafficQualityProps {
  points: TimeseriesPoint[];
  days: number;
  failed: boolean;
}

export function TrafficQuality({ points, days, failed }: TrafficQualityProps) {
  // Períodos da API são UTC — alinhar "hoje" ao mesmo fuso dos buckets.
  const today = new Date().toISOString().slice(0, 10);

  const chartData = points
    .filter((point) => point.period <= today)
    .map((point) => ({
      date: point.period,
      actions: point.bookings + point.matches,
    }));

  const totalActions = chartData.reduce((sum, point) => sum + point.actions, 0);
  const average = chartData.length > 0 ? Math.round((totalActions / chartData.length) * 10) / 10 : 0;
  const hasActivity = totalActions > 0;

  const dataWithAverage = chartData.map((point) => ({ ...point, average }));

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="font-normal">Atividade da comunidade</CardTitle>
        <CardAction>
          <Ellipsis className="size-4" />
        </CardAction>
      </CardHeader>

      <CardContent>
        {failed ? (
          <div className="flex h-68 flex-col items-center justify-center gap-2 text-center">
            <p className="font-medium text-red-700 text-sm dark:text-red-300">Não foi possível carregar a atividade.</p>
            <p className="text-red-700/80 text-xs dark:text-red-300/80">Verifique se a API está em execução.</p>
          </div>
        ) : !hasActivity ? (
          <div className="flex h-68 flex-col items-center justify-center gap-2 text-center">
            <p className="text-muted-foreground text-sm">Sem atividade nos últimos {days} dias.</p>
            <p className="text-muted-foreground/70 text-xs">Reservas e partidas criadas no período aparecem aqui.</p>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-68 w-full">
            <ComposedChart data={dataWithAverage} margin={{ bottom: 0, left: 0, right: 0, top: 0 }}>
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
                    className="w-44"
                    labelFormatter={(value) =>
                      format(parseISO(value as string), "d 'de' MMMM 'de' yyyy", { locale: ptBR })
                    }
                  />
                }
              />
              <Line
                dataKey="average"
                dot={false}
                stroke="var(--color-average)"
                strokeOpacity={0.65}
                strokeDasharray="4 4"
                strokeWidth={1.75}
                type="linear"
              />
              <Line
                dataKey="actions"
                dot={false}
                activeDot={{ r: 4 }}
                stroke="var(--color-actions)"
                strokeWidth={2.5}
                type="linear"
              />
            </ComposedChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
