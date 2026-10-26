"use client";

import { ArrowUpRight } from "lucide-react";
import { Bar, BarChart, LabelList, type LabelProps, XAxis, YAxis } from "recharts";

import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer } from "@/components/ui/chart";
import type { StoreOverviewCategory } from "@/lib/api/types";
import { formatKz } from "@/lib/format";

const trafficSourcesConfig = {
  share: {
    label: "Receita",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

type SourceRow = {
  name: string;
  visits: string;
  share: number;
  change: string;
};

type IconLabelProps = {
  height?: number | string;
  index?: number;
  rows?: SourceRow[];
  width?: number | string;
  x?: number | string;
  y?: number | string;
};

type SourceLabelProps = LabelProps & {
  index?: number;
  rows?: SourceRow[];
};

type SourceChangeLabelProps = LabelProps & {
  value?: number | string;
};

function getNumber(value: number | string | undefined) {
  return typeof value === "number" ? value : Number(value);
}

function TrafficSourceIconLabel({ height, index, rows, width, x, y }: IconLabelProps) {
  if (typeof index !== "number" || !rows) {
    return null;
  }

  const row = rows[index];
  const xValue = getNumber(x);
  const yValue = getNumber(y);
  const widthValue = getNumber(width);
  const heightValue = getNumber(height);

  if (
    !row ||
    Number.isNaN(xValue) ||
    Number.isNaN(yValue) ||
    Number.isNaN(widthValue) ||
    Number.isNaN(heightValue)
  ) {
    return null;
  }

  const iconSize = 16;
  const iconX = Math.max(xValue + 10, xValue + widthValue - iconSize - 10);
  const iconY = yValue + (heightValue - iconSize) / 2;

  return (
    <foreignObject height={iconSize} x={iconX} y={iconY} width={iconSize}>
      <div className="grid size-4 place-items-center rounded-full bg-muted font-medium text-[9px] leading-none text-foreground">
        {row.name.charAt(0).toUpperCase()}
      </div>
    </foreignObject>
  );
}

function TrafficSourceNameLabel({ height, index, rows, x, y }: SourceLabelProps) {
  if (typeof index !== "number" || !rows) {
    return null;
  }

  const row = rows[index];
  const xValue = getNumber(x);
  const yValue = getNumber(y);
  const heightValue = getNumber(height);

  if (!row || Number.isNaN(xValue) || Number.isNaN(yValue) || Number.isNaN(heightValue)) {
    return null;
  }

  return (
    <text dominantBaseline="middle" textAnchor="start" x={2} y={yValue + heightValue / 2}>
      <tspan className="fill-foreground font-medium" fontSize={13} x={2} y={yValue + heightValue / 2 - 7}>
        {row.name}
      </tspan>
      <tspan className="fill-muted-foreground" fontSize={12} x={2} y={yValue + heightValue / 2 + 11}>
        {row.visits}
      </tspan>
    </text>
  );
}

function TrafficSourceChangeLabel({ height, value, y }: SourceChangeLabelProps) {
  const yValue = getNumber(y);
  const heightValue = getNumber(height);

  if (typeof value !== "string" || Number.isNaN(yValue) || Number.isNaN(heightValue)) {
    return null;
  }

  return (
    <text
      className="fill-muted-foreground"
      dominantBaseline="middle"
      dx={-6}
      fontSize={13}
      textAnchor="end"
      x="100%"
      y={yValue + heightValue / 2}
    >
      {value}
    </text>
  );
}

type TrafficSourcesProps = {
  categories: StoreOverviewCategory[];
  totalRevenue: number;
};

export function TrafficSources({ categories, totalRevenue }: TrafficSourcesProps) {
  const rows: SourceRow[] = categories.map((category) => ({
    name: category.name,
    visits: formatKz(category.revenue),
    share: category.share,
    change: `${Math.round(category.share)}%`,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-normal text-muted-foreground text-sm">Vendas por categoria</CardTitle>
        <CardDescription className="text-foreground text-xl tabular-nums leading-none tracking-tight">
          {formatKz(totalRevenue)}
        </CardDescription>
        <CardAction>
          <ArrowUpRight className="size-4" />
        </CardAction>
      </CardHeader>

      <CardContent>
        {rows.length === 0 ? (
          <div className="grid h-54 place-items-center rounded-md border border-dashed text-muted-foreground text-sm">
            Sem vendas por categoria no período.
          </div>
        ) : (
          <ChartContainer config={trafficSourcesConfig} className="h-54 w-full">
            <BarChart
              accessibilityLayer
              barCategoryGap={12}
              data={rows}
              layout="vertical"
              margin={{ bottom: 0, left: 100, right: 50, top: 0 }}
            >
              <defs>
                <pattern
                  height="4"
                  id="ecommerce-traffic-source-background-pattern"
                  patternTransform="rotate(45)"
                  patternUnits="userSpaceOnUse"
                  width="4"
                >
                  <rect height="6" width="6" fill="var(--muted)" fillOpacity="0.5" />
                  <line
                    stroke="var(--muted-foreground)"
                    strokeOpacity="0.10"
                    strokeWidth="1.25"
                    x1="0"
                    x2="0"
                    y1="0"
                    y2="6"
                  />
                </pattern>
              </defs>
              <XAxis dataKey="share" domain={[0, 100]} hide type="number" />
              <YAxis dataKey="name" hide type="category" />
              <Bar
                background={{ fill: "url(#ecommerce-traffic-source-background-pattern)", radius: 8 }}
                barSize={36}
                dataKey="share"
                fill="var(--color-share)"
                fillOpacity={0.5}
                name="Receita"
                radius={8}
                stroke="var(--color-share)"
                strokeOpacity={0.1}
                strokeWidth={0.5}
              >
                <LabelList content={<TrafficSourceNameLabel rows={rows} />} dataKey="name" />
                <LabelList content={<TrafficSourceIconLabel rows={rows} />} dataKey="share" />
                <LabelList content={<TrafficSourceChangeLabel />} dataKey="change" />
              </Bar>
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
