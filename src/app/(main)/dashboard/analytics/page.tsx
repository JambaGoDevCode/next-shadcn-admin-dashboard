import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getProfile } from "@/lib/api/auth";
import {
  getAcquisitionFunnel,
  getAnalyticsAssets,
  getAnalyticsFeatures,
  getAudienceGrowth,
  getAudienceOverview,
  getConversionsOverview,
  getEngagementStates,
  getMetricsTimeseries,
  getTeamsTop,
} from "@/lib/api/resources";
import type {
  AcquisitionFunnel,
  AnalyticsAssets,
  AnalyticsFeatures,
  AudienceGrowth,
  AudienceOverview,
  ConversionsOverview,
  EngagementStates,
  MetricsTimeseries,
  SessionUser,
  TeamsTop,
} from "@/lib/api/types";
import { getSessionTokens } from "@/lib/auth/session";

import { AcquisitionTab } from "./_components/acquisition-tab";
import { AnalyticsKpiStrip } from "./_components/analytics-kpi-strip";
import { AnalyticsToolbar } from "./_components/analytics-toolbar";
import { AudienceTab } from "./_components/audience-tab";
import { ConversionsTab } from "./_components/conversions-tab";
import { EngagementTab } from "./_components/engagement-tab";
import { RealtimeVisitors } from "./_components/realtime-visitors";
import { TopPages } from "./_components/top-pages";
import { TopTrafficSources } from "./_components/top-traffic-sources";
import { TrafficQuality } from "./_components/traffic-quality";

interface ResourceState<T> {
  data: T | null;
  failed: boolean;
}

const RANGE_DAYS: Record<string, number> = {
  "last-7-days": 7,
  "last-4-weeks": 28,
  "last-3-months": 90,
};

function resolveRange(range: string | undefined): { range: string; days: number } {
  if (range === "year-to-date") {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1).getTime();
    const days = Math.max(1, Math.ceil((now.getTime() - startOfYear) / (24 * 60 * 60 * 1000)));
    return { range, days };
  }

  if (range && range in RANGE_DAYS) {
    return { range, days: RANGE_DAYS[range] };
  }

  return { range: "last-4-weeks", days: 28 };
}

export default async function Page({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const { range: rawRange } = await searchParams;
  const { range, days } = resolveRange(rawRange);

  const { accessToken } = await getSessionTokens();
  const token = accessToken ?? "";

  async function load<T>(fetcher: (token: string) => Promise<T>): Promise<ResourceState<T>> {
    try {
      return { data: await fetcher(token), failed: false };
    } catch {
      return { data: null, failed: true };
    }
  }

  const [profile, overview, teamsTop, assets, features, timeseries, growth, acquisition, engagement, conversions] =
    await Promise.all([
      load<SessionUser>(getProfile),
      load<AudienceOverview>((t) => getAudienceOverview(t, days)),
      load<TeamsTop>((t) => getTeamsTop(t, days)),
      load<AnalyticsAssets>(getAnalyticsAssets),
      load<AnalyticsFeatures>((t) => getAnalyticsFeatures(t, days)),
      load<MetricsTimeseries>((t) => getMetricsTimeseries(t, Math.max(days, 7))),
      load<AudienceGrowth>((t) => getAudienceGrowth(t, days)),
      load<AcquisitionFunnel>((t) => getAcquisitionFunnel(t, days)),
      load<EngagementStates>((t) => getEngagementStates(t, days)),
      load<ConversionsOverview>((t) => getConversionsOverview(t, days)),
    ]);

  const profileName = profile.data?.displayName ?? profile.data?.name;
  const firstName = profileName?.split(" ")[0];

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-1">
        <h1 className="text-3xl tracking-tight">{firstName ? `Olá, ${firstName}` : "Análise do Peladeiro"}</h1>
        <p className="text-muted-foreground text-sm">Crescimento, engajamento e conversões do negócio num só lugar.</p>
      </div>

      <Tabs defaultValue="overview" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList className="gap-1">
            <TabsTrigger value="overview">Visão geral</TabsTrigger>
            <TabsTrigger value="audience">Audiência</TabsTrigger>
            <TabsTrigger value="acquisition">Aquisição</TabsTrigger>
            <TabsTrigger value="engagement">Envolvimento</TabsTrigger>
            <TabsTrigger value="conversions">Conversões</TabsTrigger>
          </TabsList>

          <AnalyticsToolbar current={range} />
        </div>

        <TabsContent value="overview" className="flex flex-col gap-4">
          <AnalyticsKpiStrip data={overview.data} days={days} failed={overview.failed} />

          <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-12">
            <div className="xl:col-span-7">
              <TrafficQuality points={timeseries.data?.points ?? []} days={days} failed={timeseries.failed} />
            </div>
            <div className="xl:col-span-5">
              <RealtimeVisitors
                data={teamsTop.data}
                points={timeseries.data?.points ?? []}
                days={days}
                failed={teamsTop.failed}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-12">
            <div className="xl:col-span-7">
              <TopPages data={features.data} days={days} failed={features.failed} />
            </div>
            <div className="xl:col-span-5 xl:col-start-8">
              <TopTrafficSources data={assets.data} failed={assets.failed} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="audience" className="flex flex-col gap-4">
          <AudienceTab
            assets={assets.data}
            days={days}
            failed={{ overview: overview.failed, growth: growth.failed, assets: assets.failed }}
            growth={growth.data}
            overview={overview.data}
          />
        </TabsContent>

        <TabsContent value="acquisition" className="flex flex-col gap-4">
          <AcquisitionTab
            days={days}
            failed={{ funnel: acquisition.failed, growth: growth.failed, overview: overview.failed }}
            funnel={acquisition.data}
            growth={growth.data}
            overview={overview.data}
          />
        </TabsContent>

        <TabsContent value="engagement" className="flex flex-col gap-4">
          <EngagementTab
            days={days}
            failed={{ features: features.failed, growth: growth.failed, states: engagement.failed }}
            features={features.data}
            growth={growth.data}
            states={engagement.data}
          />
        </TabsContent>

        <TabsContent value="conversions" className="flex flex-col gap-4">
          <ConversionsTab data={conversions.data} days={days} failed={conversions.failed} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
