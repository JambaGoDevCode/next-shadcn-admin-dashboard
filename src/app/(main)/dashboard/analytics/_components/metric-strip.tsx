import type { ReactNode } from "react";

import { ArrowDownRight, ArrowUpRight, Ellipsis } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface MetricItem {
  title: string;
  value: string;
  /** Badge de tendência (+/-% ou p.p.). Ignorado quando null/0. */
  deltaPct?: number | null;
  deltaSuffix?: string;
  /** Badge neutro (ex.: "83% dos registos") quando não há delta. */
  badgeText?: string;
  footer?: ReactNode;
}

function TrendBadge({ deltaPct, suffix = "%" }: { deltaPct: number; suffix?: string }) {
  const up = deltaPct > 0;
  const label = `${up ? "+" : ""}${deltaPct.toFixed(1).replace(".", ",")}${suffix}`;

  return (
    <Badge
      className={
        up
          ? "bg-green-500/10 text-green-700 dark:bg-green-500/15 dark:text-green-300"
          : "bg-destructive/10 text-destructive"
      }
    >
      {up ? <ArrowUpRight /> : <ArrowDownRight />}
      {label}
    </Badge>
  );
}

/** Faixa de KPIs com o mesmo visual da "Visão geral" (faixa dividida em cards). */
export function MetricStrip({ items }: { items: MetricItem[] }) {
  const columns = items.length >= 5 ? "xl:grid-cols-5" : "xl:grid-cols-4";

  return (
    <div className="overflow-hidden rounded-xl bg-card shadow-xs ring-1 ring-foreground/10">
      <div
        className={`grid divide-y *:data-[slot=card]:rounded-none *:data-[slot=card]:ring-0 md:grid-cols-2 md:divide-x md:divide-y-0 ${columns}`}
      >
        {items.map((item) => (
          <Card key={item.title}>
            <CardHeader>
              <CardTitle className="font-normal text-sm">{item.title}</CardTitle>
              <CardAction>
                <Ellipsis className="size-4" />
              </CardAction>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-4">
                <div className="text-2xl leading-none tracking-tight">{item.value}</div>
                {item.deltaPct != null && item.deltaPct !== 0 ? (
                  <TrendBadge deltaPct={item.deltaPct} suffix={item.deltaSuffix} />
                ) : item.badgeText ? (
                  <Badge variant="outline">{item.badgeText}</Badge>
                ) : null}
              </div>

              {item.footer ? (
                <div className="flex flex-wrap items-center gap-2 text-muted-foreground text-xs">{item.footer}</div>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
