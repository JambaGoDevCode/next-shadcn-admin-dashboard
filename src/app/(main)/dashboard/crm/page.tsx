import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarDays, Server } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { getApiBaseUrl } from "@/lib/api/env";
import { getBookings, getCities, getFields, getMatches, getPlayers, getTeams } from "@/lib/api/resources";
import type { Booking, City, Field, Match, Player, Team } from "@/lib/api/types";
import { getSessionTokens } from "@/lib/auth/session";

import { BookingsStatusChart } from "./_components/bookings-status-chart";
import { CitiesPerformanceChart } from "./_components/cities-performance-chart";
import { CrmInsights } from "./_components/crm-insights";
import { CrmKpis } from "./_components/crm-kpis";
import { FieldsPortfolio } from "./_components/fields-portfolio";
import { RecentActivity } from "./_components/recent-activity";
import { TeamsPortfolio } from "./_components/teams-portfolio";

interface ResourceState<T> {
  data: T | null;
  failed: boolean;
}

export default async function CrmPage() {
  const { accessToken } = await getSessionTokens();
  const token = accessToken ?? "";

  async function load<T>(fetcher: (token: string) => Promise<T>): Promise<ResourceState<T>> {
    try {
      return { data: await fetcher(token), failed: false };
    } catch {
      return { data: null, failed: true };
    }
  }

  const [cities, fields, teams, players, matches, bookings] = await Promise.all([
    load<City[]>(getCities),
    load<Field[]>(getFields),
    load<Team[]>(getTeams),
    load<Player[]>(getPlayers),
    load<Match[]>(getMatches),
    load<Booking[]>(getBookings),
  ]);

  const safe = <T,>(resource: ResourceState<T[]>): T[] => resource.data ?? [];

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-3xl tracking-tight">CRM — Carteira de Clientes</h2>
          <p className="text-muted-foreground text-sm">
            Quadras (donos de campo), times e reservas: indicadores do funil comercial do Peladeiro.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="gap-1.5">
            <Server className="size-3" />
            {getApiBaseUrl()}
          </Badge>
          <Badge variant="outline" className="gap-1.5">
            <CalendarDays className="size-3" />
            {format(new Date(), "dd 'de' MMMM yyyy", { locale: ptBR })}
          </Badge>
        </div>
      </header>

      <CrmKpis
        data={{
          fields: safe(fields),
          teams: safe(teams),
          players: safe(players),
          matches: safe(matches),
          bookings: safe(bookings),
          cities: safe(cities),
          failed: {
            cities: cities.failed,
            fields: fields.failed,
            teams: teams.failed,
            players: players.failed,
            matches: matches.failed,
            bookings: bookings.failed,
          },
        }}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <BookingsStatusChart bookings={bookings.data} failed={bookings.failed} />
        <CitiesPerformanceChart
          cities={safe(cities)}
          fields={safe(fields)}
          teams={safe(teams)}
          matches={safe(matches)}
        />
      </div>

      <FieldsPortfolio
        fields={safe(fields)}
        cities={safe(cities)}
        matches={safe(matches)}
        bookings={safe(bookings)}
        failed={fields.failed}
      />

      <RecentActivity matches={safe(matches)} bookings={safe(bookings)} teams={safe(teams)} fields={safe(fields)} />

      <TeamsPortfolio
        teams={safe(teams)}
        cities={safe(cities)}
        players={safe(players)}
        matches={safe(matches)}
        failed={teams.failed}
      />

      <CrmInsights
        fields={safe(fields)}
        teams={safe(teams)}
        players={safe(players)}
        bookings={safe(bookings)}
        cities={safe(cities)}
      />
    </div>
  );
}
