import type { AnalyticsFeatures, AudienceGrowth, EngagementStates } from "@/lib/api/types";

import { EngagementActivity } from "./engagement-activity";
import { EngagementRetention } from "./engagement-retention";
import { EngagementStatesCard } from "./engagement-states";
import { EngagementTournaments } from "./engagement-tournaments";
import { type MetricItem, MetricStrip } from "./metric-strip";

interface EngagementTabProps {
  growth: AudienceGrowth | null;
  features: AnalyticsFeatures | null;
  states: EngagementStates | null;
  days: number;
  failed: {
    growth: boolean;
    features: boolean;
    states: boolean;
  };
}

function findFeature(features: AnalyticsFeatures["features"], key: string) {
  return features.find((feature) => feature.key === key);
}

/** Envolvimento: utilização real da plataforma e recorrência. */
export function EngagementTab({ growth, features, states, days, failed }: EngagementTabProps) {
  const activeValue = failed.growth && !growth ? "—" : (growth?.totals.activeUsers ?? 0);

  const featureItem = (key: string, title: string, footerPrefix: string): MetricItem => {
    const feature = features ? findFeature(features.features, key) : undefined;
    const failedFeatures = failed.features && !features;

    return {
      title,
      value: String(failedFeatures ? "—" : (feature?.current ?? 0)),
      deltaPct: feature?.deltaPct ?? null,
      footer: (
        <>
          <span>
            {footerPrefix} <span className="text-foreground">{failedFeatures ? "—" : (feature?.total ?? 0)}</span> no
            total
          </span>
          <span>•</span>
          <span>últimos {days} dias</span>
        </>
      ),
    };
  };

  const items: MetricItem[] = [
    {
      title: "Utilizadores ativos",
      value: String(activeValue),
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
    featureItem("bookings", "Reservas", "de"),
    featureItem("matches", "Partidas", "de"),
    featureItem("matchmaking", "Matchmaking", "de"),
  ];

  return (
    <div className="flex flex-col gap-4">
      <MetricStrip items={items} />

      <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <EngagementActivity data={features} days={days} failed={failed.features} />
        </div>
        <div className="xl:col-span-5">
          <EngagementStatesCard data={states} failed={failed.states} />
        </div>
      </div>

      <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <EngagementRetention />
        </div>
        <div className="xl:col-span-5">
          <EngagementTournaments data={features} days={days} failed={failed.features} />
        </div>
      </div>
    </div>
  );
}
