"use client";

import { ArrowUpRight, PackageCheck, PackageX, TriangleAlert } from "lucide-react";
import { Label, Pie, PieChart } from "recharts";

import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer } from "@/components/ui/chart";
import { Separator } from "@/components/ui/separator";
import type { StoreOverview } from "@/lib/api/types";

const gaugeSegmentCount = 32;

const chartConfig = {
  "in-stock": {
    label: "Em stock",
    color: "var(--chart-2)",
  },
  "low-stock": {
    label: "Stock baixo",
    color: "var(--chart-1)",
  },
  "out-of-stock": {
    label: "Esgotado",
    color: "var(--destructive)",
  },
} satisfies ChartConfig;

type InventoryProps = {
  inventory: StoreOverview["inventory"];
};

export function Inventory({ inventory }: InventoryProps) {
  const totalUnits = inventory.variants;
  const availablePercent = totalUnits > 0 ? Math.round((inventory.inStock / totalUnits) * 100) : 0;
  const inStockSegments = Math.round((inventory.inStock / Math.max(1, totalUnits)) * gaugeSegmentCount);
  const lowStockSegments = Math.round((inventory.lowStock / Math.max(1, totalUnits)) * gaugeSegmentCount);

  function getGaugeSegmentStatus(index: number) {
    if (index < inStockSegments) {
      return "in-stock";
    }

    if (index < inStockSegments + lowStockSegments) {
      return "low-stock";
    }

    return "out-of-stock";
  }

  const gaugeSegments = Array.from({ length: gaugeSegmentCount }, (_, index) => {
    const status = getGaugeSegmentStatus(index);
    return {
      fill: `var(--color-${status})`,
      id: `segment-${index + 1}`,
      status,
      value: 1,
    };
  });

  const inventorySummary = [
    {
      icon: PackageCheck,
      label: "Em stock",
      value: inventory.inStock,
    },
    {
      icon: TriangleAlert,
      label: "Stock baixo",
      value: inventory.lowStock,
    },
    {
      icon: PackageX,
      label: "Esgotado",
      value: inventory.outOfStock,
    },
  ] as const;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="font-normal text-muted-foreground text-sm">Inventário</CardTitle>
        <CardDescription className="text-foreground text-xl tabular-nums leading-none tracking-tight">
          {availablePercent}% disponíveis
        </CardDescription>
        <CardAction>
          <ArrowUpRight className="size-4" />
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <ChartContainer config={chartConfig} className="mx-auto h-30 w-full">
          <PieChart>
            <Pie
              cx="50%"
              cy="100%"
              cornerRadius={6}
              data={gaugeSegments}
              dataKey="value"
              endAngle={0}
              innerRadius={80}
              outerRadius={110}
              paddingAngle={2}
              startAngle={180}
              stroke="var(--card)"
              strokeWidth={1}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text textAnchor="middle" x={viewBox.cx} y={viewBox.cy}>
                        <tspan
                          className="fill-foreground font-medium text-2xl tabular-nums"
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) - 14}
                        >
                          {availablePercent}%
                        </tspan>
                        <tspan className="fill-muted-foreground text-xs" x={viewBox.cx} y={viewBox.cy || 0}>
                          Disponível
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
        <Separator />

        <div className="grid grid-cols-3 divide-x">
          {inventorySummary.map((item, _index) => (
            <div key={item.label} className="flex flex-col items-center gap-3 text-center">
              <div className="grid size-9 place-items-center rounded-full bg-muted">
                <item.icon className="size-4 text-muted-foreground" />
              </div>
              <div>
                <div className="text-muted-foreground text-xs leading-none">{item.label}</div>
                <div className="font-medium text-sm tabular-nums">{item.value.toLocaleString("pt-PT")}</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
