"use client";

import { MapPinned } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import type { City, Field, Match, Team } from "@/lib/api/types";

const chartConfig = {
  quadras: {
    label: "Quadras",
    color: "var(--chart-1)",
  },
  times: {
    label: "Times",
    color: "var(--chart-2)",
  },
  partidas: {
    label: "Partidas",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

interface CitiesPerformanceChartProps {
  cities: City[];
  fields: Field[];
  teams: Team[];
  matches: Match[];
}

export function CitiesPerformanceChart({ cities, fields, teams, matches }: CitiesPerformanceChartProps) {
  const data = cities
    .map((city) => ({
      cidade: city.name,
      quadras: fields.filter((field) => field.cityId === city.id).length,
      times: teams.filter((team) => team.cityId === city.id).length,
      partidas: matches.filter((match) => match.cityId === city.id).length,
    }))
    .sort(
      (a, b) =>
        b.quadras + b.times + b.partidas - (a.quadras + a.times + a.partidas) || a.cidade.localeCompare(b.cidade),
    );

  const hasData = data.some((row) => row.quadras > 0 || row.times > 0 || row.partidas > 0);

  return (
    <Card className="h-full">
      <CardHeader>
        <div>
          <CardTitle>Cobertura por cidade</CardTitle>
          <CardDescription>Quadras, times e partidas em cada cidade com operação.</CardDescription>
        </div>
      </CardHeader>

      <CardContent>
        {data.length === 0 || !hasData ? (
          <div className="flex h-54 flex-col items-center justify-center gap-2 text-center">
            <MapPinned className="size-8 text-muted-foreground/50" />
            <p className="text-muted-foreground text-sm">Sem dados de cobertura ainda.</p>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-54 w-full">
            <BarChart data={data} margin={{ bottom: 0, left: 0, right: 0, top: 0 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="cidade" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="quadras" fill="var(--color-quadras)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="times" fill="var(--color-times)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="partidas" fill="var(--color-partidas)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
