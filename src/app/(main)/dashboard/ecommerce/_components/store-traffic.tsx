"use client";

import { format, parseISO } from "date-fns";
import { pt } from "date-fns/locale";
import { ArrowUpRight } from "lucide-react";
import { Area, AreaChart, CartesianGrid, Line, XAxis, YAxis } from "recharts";

import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { StoreOverview } from "@/lib/api/types";
import { plural } from "@/lib/format";

const trafficConfig = {
  orders: {
    label: "Encomendas",
    color: "var(--chart-3)",
  },
  cancelled: {
    label: "Canceladas",
    color: "var(--destructive)",
  },
} satisfies ChartConfig;

type StoreTrafficProps = {
  overview: StoreOverview;
};

export function StoreTraffic({ overview }: StoreTrafficProps) {
  const trafficData = overview.revenue.byPeriod.map((point) => ({
    date: point.date,
    label: format(parseISO(point.date), "dd/MM"),
    orders: point.orders,
    cancelled: point.cancelled,
  }));

  const firstLabel = trafficData[0]?.label;
  const lastLabel = trafficData.at(-1)?.label;
  const orderTotal = trafficData.reduce((total, point) => total + point.orders, 0);

  function formatTrafficTick(value: string) {
    if (value === firstLabel) {
      return "início";
    }

    return value === lastLabel ? "hoje" : "";
  }

  function formatTrafficTooltipLabel(value: string) {
    return format(parseISO(value), "EEEE, d 'de' MMMM 'de' yyyy", { locale: pt });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-normal text-muted-foreground text-sm">Encomendas por dia</CardTitle>
        <CardDescription className="text-foreground text-xl tabular-nums leading-none tracking-tight">
          {orderTotal} {plural(orderTotal, "encomenda", "encomendas")}
        </CardDescription>
        <CardAction>
          <ArrowUpRight className="size-4" />
        </CardAction>
      </CardHeader>

      <CardContent>
        <ChartContainer config={trafficConfig} className="h-54 w-full">
          <AreaChart accessibilityLayer data={trafficData} margin={{ bottom: 0, left: 0, right: 0, top: 8 }}>
            <defs>
              <linearGradient id="fillOrders" x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor="var(--color-orders)" stopOpacity={0.28} />
                <stop offset="95%" stopColor="var(--color-orders)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              axisLine={false}
              dataKey="label"
              tick={{ fontSize: 11 }}
              tickFormatter={formatTrafficTick}
              tickLine={false}
              tickMargin={10}
              ticks={firstLabel && lastLabel ? [firstLabel, lastLabel] : []}
            />
            <YAxis
              axisLine={false}
              domain={[
                0,
                (dataMax: number) => Math.max(dataMax + 1, 3),
              ]}
              tickLine={false}
              tickMargin={6}
              width={36}
              yAxisId="traffic"
            />
            <ChartTooltip
              content={<ChartTooltipContent labelFormatter={(value) => formatTrafficTooltipLabel(String(value))} />}
              cursor={{ stroke: "var(--border)", strokeDasharray: "4 4" }}
            />
            <ChartLegend align="right" verticalAlign="top" className="justify-end" content={<ChartLegendContent />} />
            <Area
              dataKey="orders"
              dot={false}
              fill="url(#fillOrders)"
              stroke="var(--color-orders)"
              strokeWidth={2}
              type="stepAfter"
              yAxisId="traffic"
            />
            <Line
              dataKey="cancelled"
              dot={false}
              stroke="var(--color-cancelled)"
              strokeLinecap="round"
              strokeWidth={1.2}
              type="stepAfter"
              yAxisId="traffic"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
