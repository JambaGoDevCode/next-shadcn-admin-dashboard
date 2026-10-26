import { getAudienceGrowth, getMetricsTimeseries, getStoreOverview } from "@/lib/api/resources";
import type { AudienceGrowth, MetricsTimeseries, StoreOverview } from "@/lib/api/types";
import { getSessionTokens } from "@/lib/auth/session";

import { createLoader } from "../_components/load-resource";
import { ApiStatusHeader } from "../../_components/api-status-header";
import { PerformancePanel } from "../_components/performance-panel";

interface PeladeiroPerformancePageProps {
  searchParams: Promise<{ periodo?: string }>;
}

const ALLOWED_PERIODS = new Set([7, 30, 90]);

export default async function PeladeiroPerformancePage({ searchParams }: PeladeiroPerformancePageProps) {
  const { periodo } = await searchParams;
  const period = periodo !== undefined && ALLOWED_PERIODS.has(Number(periodo)) ? Number(periodo) : 30;

  const { accessToken } = await getSessionTokens();
  const load = createLoader(accessToken ?? "");

  const [growth, timeseries, store] = await Promise.all([
    load<AudienceGrowth>((t) => getAudienceGrowth(t, period)),
    load<MetricsTimeseries>((t) => getMetricsTimeseries(t, period)),
    load<StoreOverview>((t) => getStoreOverview(t, period)),
  ]);

  const anyFailed = [growth, timeseries, store].some((state) => state.failed);

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <ApiStatusHeader
        title="Desempenho"
        description="Peladeiro Dashboard — crescimento de utilizadores, reservas, jogos realizados e vendas por período."
        apiFailed={anyFailed}
      />
      <PerformancePanel
        period={period}
        growth={growth.data ? growth.data.totals : null}
        growthFailed={growth.failed}
        series={
          timeseries.data
            ? timeseries.data.points.map((point) => ({
                period: point.period,
                bookings: point.bookings,
                matches: point.matches,
              }))
            : null
        }
        seriesFailed={timeseries.failed}
        sales={store.data?.revenue.total ?? null}
        salesFailed={store.failed}
      />
    </div>
  );
}
