import { Boxes, Package, TriangleAlert, Wallet } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { StoreMetrics } from "@/lib/api/types";
import { formatKz, plural } from "@/lib/format";

interface SummaryCardsProps {
  metrics: StoreMetrics;
}

/**
 * Indicadores do topo: dimensão do catálogo, saúde do stock e valor
 * imobilizado — calculados pelo endpoint /store/metrics/overview.
 */
export function StoreSummaryCards({ metrics }: SummaryCardsProps) {
  const alerts = metrics.stock.lowStockItems;

  const summaryCards = [
    {
      title: "Produtos",
      value: String(metrics.products.total),
      description: `${metrics.products.active} ${plural(metrics.products.active, "ativo", "ativos")} · ${metrics.products.variants} ${plural(metrics.products.variants, "variante", "variantes")}`,
      icon: Package,
    },
    {
      title: "Stock",
      value: String(metrics.stock.units),
      description: `${metrics.stock.available} ${plural(metrics.stock.available, "unidade disponível", "unidades disponíveis")}`,
      icon: Boxes,
    },
    {
      title: "Alertas",
      value: String(alerts),
      description: `${metrics.stock.outOfStockItems} ${plural(metrics.stock.outOfStockItems, "produto esgotado", "produtos esgotados")}`,
      icon: TriangleAlert,
    },
    {
      title: "Valor em stock",
      value: formatKz(metrics.stock.value),
      description: "a preço de venda",
      icon: Wallet,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {summaryCards.map((item) => (
        <Card key={item.title} className="shadow-xs">
          <CardHeader>
            <CardTitle>
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <div className="grid size-7 place-items-center rounded-lg border bg-muted">
                  <item.icon className="size-4" />
                </div>
                {item.title}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <div className="text-2xl leading-none tracking-tight tabular-nums">{item.value}</div>
              <p className="text-muted-foreground text-sm leading-snug">{item.description}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
