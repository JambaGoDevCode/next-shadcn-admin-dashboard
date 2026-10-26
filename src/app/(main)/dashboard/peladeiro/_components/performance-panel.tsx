"use client";

import { useRouter } from "next/navigation";

import { format } from "date-fns";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { formatKz } from "@/lib/format";

export interface PerformancePoint {
  period: string;
  bookings: number;
  matches: number;
}

interface PerformancePanelProps {
  period: number;
  growth: { newUsers: number; activeUsers: number } | null;
  growthFailed: boolean;
  series: PerformancePoint[] | null;
  seriesFailed: boolean;
  sales: number | null;
  salesFailed: boolean;
}

const PERIODS = [7, 30, 90] as const;

const chartConfig = {
  bookings: {
    label: "Reservas",
    color: "var(--chart-1)",
  },
  matches: {
    label: "Jogos",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

interface KpiProps {
  label: string;
  value: string;
  hint?: string;
  failed?: boolean;
}

function Kpi({ label, value, hint, failed = false }: KpiProps) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="font-normal text-muted-foreground text-sm">{label}</CardTitle>
        {failed && <span className="text-destructive text-xs">offline</span>}
      </CardHeader>
      <CardContent>
        <div className="text-3xl leading-none tracking-tight tabular-nums">{failed ? "—" : value}</div>
        {hint && !failed && <p className="text-muted-foreground mt-1 text-xs">{hint}</p>}
      </CardContent>
    </Card>
  );
}

export function PerformancePanel({
  period,
  growth,
  growthFailed,
  series,
  seriesFailed,
  sales,
  salesFailed,
}: PerformancePanelProps) {
  const router = useRouter();

  const totalBookings = (series ?? []).reduce((sum, point) => sum + point.bookings, 0);
  const totalMatches = (series ?? []).reduce((sum, point) => sum + point.matches, 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm">Período selecionado: últimos {period} dias</p>
        <ButtonGroup>
          {PERIODS.map((days) => (
            <Button
              key={days}
              size="sm"
              variant={days === period ? "default" : "outline"}
              aria-pressed={days === period}
              onClick={() => router.replace(`/dashboard/peladeiro/desempenho?periodo=${days}`)}
            >
              {days} dias
            </Button>
          ))}
        </ButtonGroup>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Crescimento de utilizadores"
          value={String(growth?.newUsers ?? 0)}
          hint={growth ? `${growth.activeUsers} ativos no período` : undefined}
          failed={growthFailed}
        />
        <Kpi label="Reservas" value={String(totalBookings)} hint={`Últimos ${period} dias`} failed={seriesFailed} />
        <Kpi label="Jogos realizados" value={String(totalMatches)} hint={`Últimos ${period} dias`} failed={seriesFailed} />
        <Kpi
          label="Vendas"
          value={formatKz(sales ?? 0)}
          hint={`Receita da loja nos últimos ${period} dias`}
          failed={salesFailed}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Reservas e jogos por dia</CardTitle>
        </CardHeader>
        <CardContent>
          {seriesFailed ? (
            <div className="text-muted-foreground flex h-64 items-center justify-center text-sm">
              — API indisponível
            </div>
          ) : !series?.length ? (
            <div className="text-muted-foreground flex h-64 items-center justify-center text-sm">
              Sem dados no período selecionado.
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="h-64 w-full">
              <BarChart data={series} margin={{ bottom: 0, left: 0, right: 0, top: 0 }}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="period"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  interval="preserveStartEnd"
                  tickFormatter={(value: string) => format(new Date(value), "dd/MM")}
                />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="bookings" fill="var(--color-bookings)" radius={[3, 3, 0, 0]} />
                <Bar dataKey="matches" fill="var(--color-matches)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
