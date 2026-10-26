"use client";

import { ArrowUpRight, DollarSign, PackageCheck, ReceiptText, RotateCcw, ShoppingBag, Users } from "lucide-react";
import { Area, Bar, CartesianGrid, ComposedChart, XAxis, YAxis } from "recharts";

import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import type { StoreOverview, StoreOverviewPeriodPoint } from "@/lib/api/types";
import { formatKz } from "@/lib/format";

const revenueOverviewConfig = {
  revenue: {
    label: "Receita",
    color: "var(--foreground)",
  },
  orders: {
    label: "Encomendas",
    color: "var(--muted-foreground)",
  },
} satisfies ChartConfig;

function sumPeriod(
  points: StoreOverviewPeriodPoint[],
  key: keyof Pick<StoreOverviewPeriodPoint, "revenue" | "orders" | "units" | "cancelled">,
): number {
  return points.reduce((total, point) => total + point[key], 0);
}

/** % de variação entre a 2.ª e a 1.ª metade do período (null quando não há base de comparação). */
function percentChange(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return ((current - previous) / previous) * 100;
}

function formatPeriodLabel(date: string): string {
  const [year, month, day] = date.split("-");
  return `${day}/${month}`;
}

function formatTooltipValue(name: unknown, value: unknown): string {
  if (typeof value !== "number") return String(value ?? "");
  return name === "Receita" ? formatKz(value) : value.toLocaleString("pt-PT");
}

function ChangeIndicator({
  change,
  fallback,
  inverted = false,
}: {
  change: number | null;
  fallback: string;
  inverted?: boolean;
}) {
  if (change === null || !Number.isFinite(change)) {
    return <div className="text-muted-foreground text-sm">{fallback}</div>;
  }

  const positive = change >= 0;
  const good = inverted ? !positive : positive;

  return (
    <div className="text-sm">
      <span className={good ? "text-green-700 dark:text-green-300" : "text-destructive"}>
        {positive ? "+" : ""}
        {change.toFixed(1)}%
      </span>
      <span className="text-muted-foreground"> vs. período anterior</span>
    </div>
  );
}

type KpiStripProps = {
  overview: StoreOverview;
};

export function KpiStrip({ overview }: KpiStripProps) {
  const points = overview.revenue.byPeriod;
  const half = Math.floor(points.length / 2);
  const previous = points.slice(0, half);
  const current = points.slice(half);

  const revenueChange = percentChange(sumPeriod(current, "revenue"), sumPeriod(previous, "revenue"));
  const ordersChange = percentChange(sumPeriod(current, "orders"), sumPeriod(previous, "orders"));
  const cancelledChange = percentChange(sumPeriod(current, "cancelled"), sumPeriod(previous, "cancelled"));
  const previousOrders = sumPeriod(previous, "orders");
  const currentOrders = sumPeriod(current, "orders");
  const previousAverage = previousOrders > 0 ? sumPeriod(previous, "revenue") / previousOrders : 0;
  const currentAverage = currentOrders > 0 ? sumPeriod(current, "revenue") / currentOrders : 0;
  const averageChange = percentChange(currentAverage, previousAverage);

  const stockPercent =
    overview.inventory.variants > 0
      ? Math.round((overview.inventory.inStock / overview.inventory.variants) * 100)
      : 0;

  const chartData = points.map((point) => ({
    period: formatPeriodLabel(point.date),
    revenue: point.revenue,
    orders: point.orders,
  }));

  return (
    <div className="h-full overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10 xl:col-span-12">
      <div>
        <div className="grid grid-cols-1 xl:grid-cols-12">
          <div className="grid grid-cols-1 md:grid-cols-2 md:grid-rows-3 xl:col-span-5 xl:border-r">
            <Card className="h-full rounded-none border-0 border-border border-b ring-0 md:border-r">
              <CardHeader>
                <CardTitle className="font-normal text-sm">Vendas totais</CardTitle>
                <CardDescription className="text-3xl text-foreground tabular-nums leading-none tracking-tight">
                  {formatKz(overview.revenue.total)}
                </CardDescription>
                <CardAction className="grid size-6 place-items-center rounded-sm bg-muted">
                  <DollarSign className="size-3 text-foreground" />
                </CardAction>
              </CardHeader>
              <CardContent>
                <ChangeIndicator change={revenueChange} fallback="Receita total do período" />
              </CardContent>
            </Card>

            <Card className="h-full rounded-none border-0 border-border border-b ring-0">
              <CardHeader>
                <CardTitle className="font-normal text-sm">Total de encomendas</CardTitle>
                <CardDescription className="text-3xl text-foreground tabular-nums leading-none tracking-tight">
                  {overview.orders.total}
                </CardDescription>
                <CardAction className="grid size-6 place-items-center rounded-sm bg-muted">
                  <ShoppingBag className="size-3 text-foreground" />
                </CardAction>
              </CardHeader>
              <CardContent>
                <ChangeIndicator change={ordersChange} fallback="Encomendas registadas" />
              </CardContent>
            </Card>

            <Card className="h-full rounded-none border-0 border-border border-b ring-0 md:border-r">
              <CardHeader>
                <CardTitle className="font-normal text-sm">Clientes</CardTitle>
                <CardDescription className="text-3xl text-foreground tabular-nums leading-none tracking-tight">
                  {overview.customers.total}
                </CardDescription>
                <CardAction className="grid size-6 place-items-center rounded-sm bg-muted">
                  <Users className="size-3 text-foreground" />
                </CardAction>
              </CardHeader>
              <CardContent>
                <div className="text-muted-foreground text-sm">Com encomendas registadas</div>
              </CardContent>
            </Card>

            <Card className="h-full rounded-none border-0 border-border border-b ring-0">
              <CardHeader>
                <CardTitle className="font-normal text-sm">Ticket médio</CardTitle>
                <CardDescription className="text-3xl text-foreground tabular-nums leading-none tracking-tight">
                  {formatKz(overview.orders.averageValue)}
                </CardDescription>
                <CardAction className="grid size-6 place-items-center rounded-sm bg-muted">
                  <ReceiptText className="size-3 text-foreground" />
                </CardAction>
              </CardHeader>
              <CardContent>
                <ChangeIndicator change={averageChange} fallback="Receita média por encomenda" />
              </CardContent>
            </Card>

            <Card className="h-full rounded-none border-0 border-border border-b ring-0 md:border-r md:border-b-0">
              <CardHeader>
                <CardTitle className="font-normal text-sm">Cancelamentos</CardTitle>
                <CardDescription className="text-3xl text-foreground tabular-nums leading-none tracking-tight">
                  {overview.orders.cancelled}
                </CardDescription>
                <CardAction className="grid size-6 place-items-center rounded-sm bg-muted">
                  <RotateCcw className="size-3 text-foreground" />
                </CardAction>
              </CardHeader>
              <CardContent>
                <ChangeIndicator change={cancelledChange} fallback="Encomendas canceladas" inverted />
              </CardContent>
            </Card>

            <Card className="h-full rounded-none border-0 ring-0">
              <CardHeader>
                <CardTitle className="font-normal text-sm">Precisão de stock</CardTitle>
                <CardDescription className="text-3xl text-foreground tabular-nums leading-none tracking-tight">
                  {stockPercent}%
                </CardDescription>
                <CardAction className="grid size-6 place-items-center rounded-sm bg-muted">
                  <PackageCheck className="size-3 text-foreground" />
                </CardAction>
              </CardHeader>
              <CardContent>
                <div className="text-muted-foreground text-sm">
                  {overview.inventory.lowStock} variantas com stock baixo
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="h-full rounded-none border-0 ring-0 xl:col-span-7">
            <CardHeader>
              <CardTitle className="font-normal">Resumo de vendas</CardTitle>
              <CardAction>
                <ArrowUpRight className="size-4" />
              </CardAction>
            </CardHeader>

            <CardContent>
              <ChartContainer config={revenueOverviewConfig} className="h-74 w-full">
                <ComposedChart
                  accessibilityLayer
                  data={chartData}
                  margin={{ bottom: 0, left: 0, right: 0, top: 0 }}
                >
                  <defs>
                    <filter id="sales-line-glow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="4" result="blur" />
                      <feFlood floodColor="var(--color-revenue)" floodOpacity="0.35" />
                      <feComposite in2="blur" operator="in" />
                      <feMerge>
                        <feMergeNode />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  <CartesianGrid yAxisId="orders" vertical={false} />
                  <XAxis
                    dataKey="period"
                    axisLine={false}
                    height={30}
                    interval={0}
                    minTickGap={0}
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    tickMargin={8}
                  />
                  <YAxis yAxisId="revenue" hide domain={[0, "auto"]} />
                  <YAxis yAxisId="orders" hide domain={[0, "auto"]} />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        className="w-44"
                        labelFormatter={(value) => `Dia ${String(value)}`}
                        formatter={(value, name, item) => (
                          <>
                            <div
                              className="size-2.5 shrink-0 rounded-[2px]"
                              style={{
                                backgroundColor: item.color,
                              }}
                            />
                            <div className="flex flex-1 items-center justify-between leading-none">
                              <span className="text-muted-foreground">{String(name ?? "")}</span>
                              <span className="font-medium font-mono text-foreground tabular-nums">
                                {formatTooltipValue(name, value)}
                              </span>
                            </div>
                          </>
                        )}
                      />
                    }
                    cursor={{
                      stroke: "var(--border)",
                      strokeDasharray: "4 4",
                    }}
                  />
                  <Bar
                    yAxisId="orders"
                    barSize={4}
                    dataKey="orders"
                    fill="var(--color-orders)"
                    name="Encomendas"
                    opacity={0.18}
                    radius={[6, 6, 0, 0]}
                  />
                  <Area
                    yAxisId="revenue"
                    dataKey="revenue"
                    fill="none"
                    filter="url(#sales-line-glow)"
                    name="Receita"
                    stroke="var(--color-revenue)"
                    strokeWidth={1.8}
                    type="linear"
                    activeDot={{
                      r: 4,
                      fill: "var(--background)",
                      stroke: "var(--color-revenue)",
                      strokeWidth: 2,
                    }}
                    dot={false}
                  />
                </ComposedChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
