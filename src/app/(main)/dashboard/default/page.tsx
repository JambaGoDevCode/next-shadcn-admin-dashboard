import { getTournaments } from "@/lib/api/management";
import {
  getAudienceOverview,
  getMatches,
  getMetricsOverview,
  getStoreMetrics,
  getStoreOverview,
} from "@/lib/api/resources";
import type { AudienceOverview, Match, MetricsOverview, StoreMetrics, StoreOverview, Tournament } from "@/lib/api/types";
import { getSessionTokens } from "@/lib/auth/session";

import { HubHeader } from "./_components/hub-header";
import { HubSections, type ResourceState } from "./_components/hub-sections";

export default async function Page() {
  const { accessToken } = await getSessionTokens();
  const token = accessToken ?? "";

  async function load<T>(fetcher: (token: string) => Promise<T>): Promise<ResourceState<T>> {
    try {
      return { data: await fetcher(token), failed: false };
    } catch {
      return { data: null, failed: true };
    }
  }

  const [metrics, matches, tournaments, storeMetrics, storeOverview, audience] = await Promise.all([
    load<MetricsOverview>(getMetricsOverview),
    load<Match[]>(getMatches),
    load<Tournament[]>(getTournaments),
    load<StoreMetrics>(getStoreMetrics),
    load<StoreOverview>((t) => getStoreOverview(t, 30)),
    load<AudienceOverview>((t) => getAudienceOverview(t, 30)),
  ]);

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <HubHeader />
      <HubSections
        metrics={metrics}
        matches={matches}
        tournaments={tournaments}
        storeMetrics={storeMetrics}
        storeOverview={storeOverview}
        audience={audience}
      />
    </div>
  );
}
