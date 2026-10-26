import type { AnalyticsAssets, AudienceGrowth, AudienceOverview } from "@/lib/api/types";

import { AudienceComposition } from "./audience-composition";
import { AudienceGeography } from "./audience-geography";
import { GrowthChart } from "./growth-chart";
import { type MetricItem, MetricStrip } from "./metric-strip";

interface AudienceTabProps {
  overview: AudienceOverview | null;
  growth: AudienceGrowth | null;
  assets: AnalyticsAssets | null;
  days: number;
  failed: {
    overview: boolean;
    growth: boolean;
    assets: boolean;
  };
}

/** Audiência: dimensão, perfil e distribuição da comunidade. */
export function AudienceTab({ overview, growth, assets, days, failed }: AudienceTabProps) {
  const value = (display: number | string) => (failed.overview && !overview ? "—" : display);

  const items: MetricItem[] = [
    {
      title: "Utilizadores totais",
      value: String(value(overview?.users.total ?? 0)),
      footer: (
        <>
          <span>
            <span className="text-foreground">{value(overview?.users.active ?? 0)}</span> ativos por conta
          </span>
          <span>•</span>
          <span>últimos {days} dias</span>
        </>
      ),
    },
    {
      title: "Novos utilizadores",
      value: String(value(overview?.users.current ?? 0)),
      deltaPct: overview?.users.deltaPct ?? null,
      footer: (
        <>
          <span>
            de <span className="text-foreground">{value(overview?.users.previous ?? 0)}</span> no período anterior
          </span>
          <span>•</span>
          <span>últimos {days} dias</span>
        </>
      ),
    },
    {
      title: "Utilizadores ativos",
      value: failed.growth && !growth ? "—" : (growth?.totals.activeUsers ?? 0),
      footer: (
        <>
          <span>
            <span className="text-foreground">com reservas ou partidas</span> no período
          </span>
          <span>•</span>
          <span>últimos {days} dias</span>
        </>
      ),
    },
    {
      title: "Jogadores",
      value: String(value(overview?.players.total ?? 0)),
      deltaPct: overview?.players.deltaPct ?? null,
      footer: (
        <>
          <span>
            <span className="text-foreground">{value(overview?.players.current ?? 0)}</span> novos no período
          </span>
          <span>•</span>
          <span>últimos {days} dias</span>
        </>
      ),
    },
    {
      title: "Cidades alcançadas",
      value: failed.assets && !assets ? "—" : (assets?.byCity.length ?? 0),
      footer: (
        <>
          <span>
            com <span className="text-foreground">quadras, equipas ou jogadores</span>
          </span>
          <span>•</span>
          <span>conforme o registo</span>
        </>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <MetricStrip items={items} />

      <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <GrowthChart points={growth?.points ?? []} days={days} failed={failed.growth} />
        </div>
        <div className="xl:col-span-5">
          <AudienceGeography data={assets} failed={failed.assets} />
        </div>
      </div>

      <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-12">
        <div className="xl:col-span-12">
          <AudienceComposition data={assets} failed={failed.assets} />
        </div>
      </div>
    </div>
  );
}
