import { ArrowDownRight, ArrowUpRight, Ellipsis } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AudienceOverview } from "@/lib/api/types";

interface AnalyticsKpiStripProps {
  data: AudienceOverview | null;
  days: number;
  failed: boolean;
}

function TrendBadge({ deltaPct, suffix = "%" }: { deltaPct: number | null; suffix?: string }) {
  if (deltaPct === null || deltaPct === 0) return null;

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

function formatRate(rate: number): string {
  return `${rate.toFixed(1).replace(".", ",")}%`;
}

export function AnalyticsKpiStrip({ data, days, failed }: AnalyticsKpiStripProps) {
  const users = data?.users;
  const players = data?.players;
  const bookings = data?.bookings;
  const conversion = data?.conversion;
  const value = (display: string | number) => (failed ? "—" : display);

  return (
    <div className="overflow-hidden rounded-xl bg-card shadow-xs ring-1 ring-foreground/10">
      <div className="grid divide-y *:data-[slot=card]:rounded-none *:data-[slot=card]:ring-0 md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-5">
        <Card>
          <CardHeader>
            <CardTitle className="font-normal text-sm">Utilizadores totais</CardTitle>
            <CardAction>
              <Ellipsis className="size-4" />
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <div className="text-2xl leading-none tracking-tight">{value(users?.total ?? 0)}</div>
            </div>

            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <span>
                <span className="text-foreground">{value(users?.active ?? 0)}</span> ativos
              </span>
              <span>•</span>
              <span>últimos {days} dias</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-normal text-sm">Novos utilizadores</CardTitle>
            <CardAction>
              <Ellipsis className="size-4" />
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <div className="text-2xl leading-none tracking-tight">{value(users?.current ?? 0)}</div>
              <TrendBadge deltaPct={users?.deltaPct ?? null} />
            </div>

            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <span>
                de <span className="text-foreground">{value(users?.previous ?? 0)}</span> no período anterior
              </span>
              <span>•</span>
              <span>últimos {days} dias</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-normal text-sm">Jogadores</CardTitle>
            <CardAction>
              <Ellipsis className="size-4" />
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <div className="text-2xl leading-none tracking-tight">{value(players?.total ?? 0)}</div>
              <TrendBadge deltaPct={players?.deltaPct ?? null} />
            </div>

            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <span>
                <span className="text-foreground">{value(players?.current ?? 0)}</span> novos no período
              </span>
              <span>•</span>
              <span>últimos {days} dias</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-normal text-sm">Reservas</CardTitle>
            <CardAction>
              <Ellipsis className="size-4" />
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <div className="text-2xl leading-none tracking-tight">{value(bookings?.current ?? 0)}</div>
              <TrendBadge deltaPct={bookings?.deltaPct ?? null} />
            </div>

            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <span>
                de <span className="text-foreground">{value(bookings?.total ?? 0)}</span> no total
              </span>
              <span>•</span>
              <span>últimos {days} dias</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-normal text-sm">Taxa de conversão</CardTitle>
            <CardAction>
              <Ellipsis className="size-4" />
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <div className="text-2xl leading-none tracking-tight">{value(formatRate(conversion?.rate ?? 0))}</div>
              <TrendBadge deltaPct={conversion?.deltaPct ?? null} suffix=" p.p." />
            </div>

            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <span>
                <span className="text-foreground">{value(conversion?.bookers ?? 0)}</span> de {value(users?.total ?? 0)}{" "}
                utilizadores reservaram
              </span>
              <span>•</span>
              <span>últimos {days} dias</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
