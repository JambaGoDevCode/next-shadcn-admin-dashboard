"use client";

import { Ellipsis } from "lucide-react";
import { Bar, BarChart, type BarShapeProps, XAxis, YAxis } from "recharts";

import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import type { TeamsTop, TimeseriesPoint } from "@/lib/api/types";

const chartConfig = {
  matches: {
    color: "var(--chart-3)",
    label: "Partidas",
  },
} satisfies ChartConfig;

interface RealtimeVisitorsProps {
  data: TeamsTop | null;
  points: TimeseriesPoint[];
  days: number;
  failed: boolean;
}

function RealtimeBarShape(props: BarShapeProps) {
  const { height, payload, width, x, y } = props;
  const barPayload = payload as { period?: string; matches?: number } | undefined;
  const barHeightValue = Number(height);
  const barWidthValue = Number(width);
  const xValue = Number(x);
  const yValue = Number(y);
  const matches = barPayload?.matches ?? 0;
  const fill = "var(--color-matches)";
  const fillOpacity = matches > 0 ? 0.85 : 0.4;
  const baselineFill = matches === 0 ? "var(--muted-foreground)" : fill;
  const baselineOpacity = matches === 0 ? 0.35 : 1;
  const baselineY = yValue + barHeightValue - 2;
  const barGap = 4;
  const barHeight = Math.max(0, barHeightValue - barGap);

  return (
    <g>
      <rect
        x={xValue}
        y={baselineY}
        width={barWidthValue}
        height={2}
        rx={1}
        fill={baselineFill}
        fillOpacity={baselineOpacity}
      />
      {matches > 0 && barHeight > 0 ? (
        <rect
          x={xValue}
          y={yValue}
          width={barWidthValue}
          height={barHeight}
          rx={2}
          fill={fill}
          fillOpacity={fillOpacity}
        />
      ) : null}
    </g>
  );
}

const CELL_CLASSES = [
  "flex items-center gap-3 border-border/50 border-r border-b pt-1 pr-5 pb-4",
  "flex items-center gap-3 border-border/50 border-b pt-1 pb-4 pl-5",
  "flex items-center gap-3 border-border/50 border-r pt-4 pr-5 pb-1",
  "flex items-center gap-3 pt-4 pb-1 pl-5",
];

export function RealtimeVisitors({ data, points, days, failed }: RealtimeVisitorsProps) {
  // Períodos da API são UTC — alinhar "hoje" ao mesmo fuso dos buckets.
  const today = new Date().toISOString().slice(0, 10);

  const chartData = points
    .filter((point) => point.period <= today)
    .map((point) => ({ period: point.period, matches: point.matches }));

  const maxMatches = Math.max(1, ...chartData.map((point) => point.matches));
  const hasMatches = chartData.some((point) => point.matches > 0);
  const topTeams = data?.teams.slice(0, 4) ?? [];

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="font-normal">Equipas com mais jogos</CardTitle>
        <CardAction>
          <Ellipsis className="size-4" />
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <div className="flex items-end justify-between">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl tabular-nums leading-none tracking-tight">
              {failed ? "—" : (data?.periodMatches ?? 0)}
            </span>
            <span className="text-muted-foreground text-sm">partidas</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <span>Últimos {days} dias</span>
          </div>
        </div>

        {hasMatches ? (
          <ChartContainer config={chartConfig} className="h-36 w-full">
            <BarChart data={chartData} margin={{ bottom: 0, left: 0, right: 0, top: 0 }} barCategoryGap={3}>
              <XAxis dataKey="period" hide />
              <YAxis hide domain={[0, maxMatches]} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
              <Bar dataKey="matches" fill="var(--color-matches)" shape={RealtimeBarShape} />
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="flex h-36 items-center justify-center rounded-lg border border-dashed text-muted-foreground text-sm">
            {failed ? "Não foi possível carregar as partidas." : "Sem partidas no período."}
          </div>
        )}

        {topTeams.length > 0 ? (
          <div className="grid grid-cols-2">
            {topTeams.map((team, index) => (
              <div className={CELL_CLASSES[index]} key={team.id}>
                <span
                  aria-hidden="true"
                  className="flex size-5 shrink-0 items-center justify-center rounded-full border text-[11px] tabular-nums text-muted-foreground ring-1 ring-foreground/10"
                >
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm" title={`${team.name} — ${team.city}`}>
                  {team.name}
                </span>
                <span className="text-sm tabular-nums">{team.matches}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center pt-2 pb-1 text-muted-foreground text-sm">
            Sem dados de equipas no período.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
