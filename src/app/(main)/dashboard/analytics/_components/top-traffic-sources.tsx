"use client";

import { Ellipsis } from "lucide-react";
import { Bar, BarChart, CartesianGrid, LabelList, type LabelProps, XAxis, YAxis } from "recharts";

import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AnalyticsAssets } from "@/lib/api/types";

const chartConfig = {
  visitors: {
    color: "var(--chart-1)",
    label: "Registos",
  },
} satisfies ChartConfig;

type TrafficSourceDatum = {
  label: string;
  source: string;
  visitors: number;
};

const numberFormatter = new Intl.NumberFormat("pt-PT", { maximumFractionDigits: 0 });

const PROFILE_LABELS: Record<string, string> = {
  ADMIN: "Administrador",
  FIELD_OWNER: "Dono de quadra",
  MODERATOR: "Moderador",
  ORGANIZER: "Organizador",
  PLATFORM_MANAGER: "Gestor da plataforma",
  PLAYER: "Jogador",
  REGULAR: "Regular",
  REFEREE: "Árbitro",
  STAFF: "Equipa técnica",
  SUPPORT: "Suporte",
  SUPER_ADMIN: "Super administrador",
  TEAM_MANAGER: "Gerente de equipa",
  TEAM_OWNER: "Dono de equipa",
  USER: "Usuário",
};

function renderValueLabel(props: LabelProps) {
  const { height, value, y } = props;

  return (
    <text
      className="fill-foreground"
      dominantBaseline="middle"
      dx={-6}
      fontSize={14}
      textAnchor="end"
      x="100%"
      y={Number(y) + Number(height) / 2}
    >
      {value}
    </text>
  );
}

function TrafficSourceBarChart({ data }: { data: TrafficSourceDatum[] }) {
  if (data.length === 0 || data.every((item) => item.visitors === 0)) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground text-sm">
        Sem registos para exibir.
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="h-64 w-full">
      <BarChart
        accessibilityLayer
        data={data}
        layout="vertical"
        margin={{
          left: 0,
          right: 48,
        }}
      >
        <CartesianGrid horizontal={false} vertical={false} />
        <YAxis dataKey="source" hide tickLine={false} tickMargin={10} type="category" />
        <XAxis dataKey="visitors" hide type="number" />
        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
        <Bar barSize={40} dataKey="visitors" fill="var(--color-visitors)" fillOpacity={0.5} radius={8}>
          <LabelList className="fill-foreground" dataKey="source" fontSize={14} offset={12} position="insideLeft" />
          <LabelList content={renderValueLabel} dataKey="label" />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}

interface TopTrafficSourcesProps {
  data: AnalyticsAssets | null;
  failed: boolean;
}

export function TopTrafficSources({ data, failed }: TopTrafficSourcesProps) {
  const resourcesData: TrafficSourceDatum[] = data
    ? [
        { label: numberFormatter.format(data.totals.fields), source: "Campos", visitors: data.totals.fields },
        { label: numberFormatter.format(data.totals.teams), source: "Equipas", visitors: data.totals.teams },
        { label: numberFormatter.format(data.totals.players), source: "Jogadores", visitors: data.totals.players },
      ]
    : [];

  const citiesData: TrafficSourceDatum[] = (data?.byCity ?? []).map((entry) => ({
    label: numberFormatter.format(entry.total),
    source: entry.city,
    visitors: entry.total,
  }));

  const profilesData: TrafficSourceDatum[] = (data?.byProfile ?? []).map((entry) => ({
    label: numberFormatter.format(entry.count),
    source: PROFILE_LABELS[entry.type] ?? entry.type,
    visitors: entry.count,
  }));

  return (
    <Card className="h-full gap-2">
      <CardHeader>
        <CardTitle className="font-normal">Campos, Equipas e Jogadores</CardTitle>
        <CardAction>
          <Ellipsis className="size-4" />
        </CardAction>
      </CardHeader>

      <CardContent className="px-0">
        {failed ? (
          <div className="flex h-64 flex-col items-center justify-center gap-2 px-4 text-center">
            <p className="font-medium text-red-700 text-sm dark:text-red-300">Não foi possível carregar os recursos.</p>
            <p className="text-red-700/80 text-xs dark:text-red-300/80">Verifique se a API está em execução.</p>
          </div>
        ) : (
          <Tabs defaultValue="resources" className="flex flex-col gap-3">
            <TabsList className="w-full justify-start border-b px-2.5" variant="line">
              <TabsTrigger className="flex-none font-normal" value="resources">
                Recursos
              </TabsTrigger>
              <TabsTrigger className="flex-none font-normal" value="cities">
                Cidades
              </TabsTrigger>
              <TabsTrigger className="flex-none font-normal" value="profiles">
                Perfis
              </TabsTrigger>
            </TabsList>

            <TabsContent value="resources" className="px-4">
              <TrafficSourceBarChart data={resourcesData} />
            </TabsContent>

            <TabsContent value="cities" className="px-4">
              <TrafficSourceBarChart data={citiesData} />
            </TabsContent>

            <TabsContent value="profiles" className="px-4">
              <TrafficSourceBarChart data={profilesData} />
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
