import { ArrowUpRight } from "lucide-react";

import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { StoreOverviewCategory, StoreOverviewTopProduct } from "@/lib/api/types";
import { formatKz } from "@/lib/format";

const categoryColors = [
  "var(--chart-3)",
  "var(--chart-2)",
  "var(--chart-1)",
  "var(--chart-4)",
  "var(--chart-5)",
] as const;

type TopProductsProps = {
  products: StoreOverviewTopProduct[];
  categories: StoreOverviewCategory[];
};

export function TopProducts({ products, categories }: TopProductsProps) {
  const segments = categories.map((category, index) => ({
    name: category.name,
    share: category.share,
    color: categoryColors[index % categoryColors.length],
  }));
  const topShare = products.reduce((total, product) => total + product.share, 0);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="font-normal text-muted-foreground text-sm">Top produtos</CardTitle>
        <CardDescription className="text-foreground text-xl tabular-nums leading-none tracking-tight">
          {products.length > 0 ? `${Math.round(topShare)}% da receita` : "Sem vendas no período"}
        </CardDescription>
        <CardAction>
          <ArrowUpRight className="size-4" />
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <div aria-label="Vendas por categoria" className="flex h-2 gap-1 overflow-hidden bg-muted" role="img">
            {segments.map((segment) => (
              <div
                aria-hidden="true"
                key={segment.name}
                className="rounded-md"
                style={{
                  backgroundColor: segment.color,
                  width: `${segment.share}%`,
                }}
              />
            ))}
          </div>

          <div className="flex flex-wrap gap-4">
            {segments.map((segment) => (
              <div className="flex items-center gap-1" key={segment.name}>
                <span aria-hidden="true" className="size-2 rounded-full" style={{ backgroundColor: segment.color }} />
                <span className="text-muted-foreground text-xs">{segment.name}</span>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 gap-y-3">
          <div className="text-muted-foreground text-xs">Produtos</div>
          <div className="text-muted-foreground text-xs">Partilha</div>
          <div className="text-muted-foreground text-xs">Vendas</div>

          {products.length > 0 ? (
            products.map((product) => (
              <div className="contents text-sm" key={product.name}>
                <div className="min-w-0">
                  <div className="truncate font-medium">{product.name}</div>
                  <div className="text-muted-foreground text-xs">{product.category ?? "Sem categoria"}</div>
                </div>
                <div className="self-center text-muted-foreground tabular-nums">
                  {Math.round(product.share)}%
                </div>
                <div className="self-center font-medium tabular-nums">{formatKz(product.revenue)}</div>
              </div>
            ))
          ) : (
            <div className="col-span-3 text-muted-foreground text-sm">Sem dados de vendas no período.</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
