import { getTournaments } from "@/lib/api/management";
import { getMatches, getMetricsOverview, getStoreOverview } from "@/lib/api/resources";
import type { Match, MetricsOverview, StoreOverview, Tournament } from "@/lib/api/types";
import { getSessionTokens } from "@/lib/auth/session";

import { createLoader } from "./_components/load-resource";
import { OverviewKpis, type OverviewStat } from "./_components/overview-kpis";
import { ApiStatusHeader } from "../_components/api-status-header";

export default async function PeladeiroOverviewPage() {
  const { accessToken } = await getSessionTokens();
  const load = createLoader(accessToken ?? "");

  const [metrics, matches, tournaments, store] = await Promise.all([
    load<MetricsOverview>(getMetricsOverview),
    load<Match[]>(getMatches),
    load<Tournament[]>(getTournaments),
    load<StoreOverview>((t) => getStoreOverview(t, 30)),
  ]);

  const now = Date.now();
  const upcoming = (matches.data ?? []).filter((m) => new Date(m.matchDate).getTime() > now).length;
  const inProgress = (tournaments.data ?? []).filter((t) => t.status === "IN_PROGRESS").length;

  const stats: OverviewStat[] = [
    {
      id: "users",
      label: "Utilizadores",
      value: metrics.data?.users.total ?? 0,
      hint: metrics.data ? `${metrics.data.users.active} ativas` : undefined,
      failed: metrics.failed,
    },
    {
      id: "teams",
      label: "Equipas",
      value: metrics.data?.teams.total ?? 0,
      hint: metrics.data ? `${metrics.data.teams.active} ativas` : undefined,
      failed: metrics.failed,
    },
    {
      id: "fields",
      label: "Campos",
      value: metrics.data?.fields.total ?? 0,
      hint: metrics.data ? `${metrics.data.fields.available} disponíveis` : undefined,
      failed: metrics.failed,
    },
    {
      id: "bookings",
      label: "Reservas",
      value: metrics.data?.bookings.total ?? 0,
      hint: metrics.data ? `${metrics.data.bookings.pending} pendentes` : undefined,
      failed: metrics.failed,
    },
    {
      id: "matches",
      label: "Jogos",
      value: matches.failed ? 0 : (matches.data?.length ?? 0),
      hint: `${upcoming} agendados`,
      failed: matches.failed,
    },
    {
      id: "tournaments",
      label: "Torneios",
      value: tournaments.failed ? 0 : (tournaments.data?.length ?? 0),
      hint: `${inProgress} em curso`,
      failed: tournaments.failed,
    },
    {
      id: "orders",
      label: "Encomendas",
      value: store.data?.orders.total ?? 0,
      hint: store.data ? `${store.data.orders.pending} pendentes de pagamento` : undefined,
      failed: store.failed,
    },
  ];

  const anyFailed = stats.some((stat) => stat.failed);

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <ApiStatusHeader
        title="Peladeiro Dashboard"
        description="Visão geral: estado da plataforma num só lugar."
        apiFailed={anyFailed}
      />
      <OverviewKpis stats={stats} />
    </div>
  );
}
