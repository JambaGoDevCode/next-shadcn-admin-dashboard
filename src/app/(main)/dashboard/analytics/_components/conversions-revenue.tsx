"use client";

import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Ellipsis } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import type { RevenuePoint } from "@/lib/api/types";
import { formatKz } from "@/lib/format";

const chartConfig = {
  volume: {
    color: "var(--chart-1)",
    label: "Volume (Kz)",
  },
} satisfies ChartConfig;

interface ConversionsRevenueProps {
  points: RevenuePoint[];
  days: number;
  failed: boolean;
}

/** Volume de pagamentos confirmados por período, em Kwanzas. */
export function ConversionsRevenue({ points, days, failed }: ConversionsRevenueProps) {
  // Períodos da API são UTC — alinhar "hoje" ao mesmo fuso dos buckets.
  const today = new Date().toISOString().slice(0, 10);

  const chartData = points
    .filter((point) => point.period <= today)
    .map((point) => ({ date: point.period, volume: point.volume }));

  const totalVolume = chartData.reduce((sum, point) => sum + point.volume, 0);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="font-normal">Volume financeiro por período</CardTitle>
        <CardAction>
          <Ellipsis className="size-4" />
        </CardAction>
      </CardHeader>

      <CardContent>
        {failed ? (
          <div className="flex h-68 flex-col items-center justify-center gap-2 text-center">
            <p className="font-medium text-red-700 text-sm dark:text-red-300">Não foi possível carregar o volume.</p>
            <p className="text-red-700/80 text-xs dark:text-red-300/80">Verifique se a API está em execução.</p>
          </div>
        ) : totalVolume <= 0 ? (
          <div className="flex h-68 flex-col items-center justify-center gap-2 text-center">
            <p className="text-muted-foreground text-sm">Sem volume confirmado nos últimos {days} dias.</p>
            <p className="text-muted-foreground/70 text-xs">
              Pagamentos com estado &quot;Pago&quot; entram aqui automaticamente.
            </p>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-68 w-full">
            <AreaChart data={chartData} margin={{ bottom: 0, left: 0, right: 0, top: 0 }}>
              <defs>
                <linearGradient fill="volume" id="fillVolume" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-volume)" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="var(--color-volume)" stopOpacity={0.05} />
                </linearGradient>
              </defs>
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
                axisLine={false}
                domain={[0, (dataMax: number) => Math.max(dataMax, 1000)]}
                tickFormatter={(value: number) =>
                  value >= 1_000_000 ? `${Math.round(value / 1_000_000)}M` : `${Math.round(value / 1000)}k`
                }
                tickLine={false}
                tickMargin={10}
                width={44}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    className="w-44"
                    formatter={(value) => formatKz(Number(value))}
                    labelFormatter={(value) =>
                      format(parseISO(value as string), "d 'de' MMMM 'de' yyyy", { locale: ptBR })
                    }
                  />
                }
              />
              <Area
                dataKey="volume"
                fill="url(#fillVolume)"
                stroke="var(--color-volume)"
                strokeWidth={2.5}
                type="monotone"
              />
            </AreaChart>
          </ChartContainer>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-2 text-muted-foreground text-xs">
          <span>
            Total no período: <span className="text-foreground">{formatKz(totalVolume)}</span>
          </span>
          <span>•</span>
          <span>pagamentos confirmados</span>
        </div>
      </CardContent>
    </Card>
  );
}
