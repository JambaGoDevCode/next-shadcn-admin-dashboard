import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import type { Booking, City, Field, Match, Player, Team } from "@/lib/api/types";
import { formatKz, plural } from "@/lib/format";

export interface CrmKpisData {
  fields: Field[];
  teams: Team[];
  players: Player[];
  matches: Match[];
  bookings: Booking[];
  cities: City[];
  failed: Record<string, boolean>;
}

interface StatCardProps {
  label: string;
  value: string;
  hint: string;
  failed: boolean;
}

function StatCard({ label, value, hint, failed }: StatCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-3xl leading-none tracking-tight">
          {failed ? <span className="text-destructive text-lg">Falha ao carregar</span> : value}
        </div>
        <p className="text-muted-foreground text-sm">{failed ? "Indisponível no momento" : hint}</p>
      </CardContent>
    </Card>
  );
}

export function CrmKpis({ data }: { data: CrmKpisData }) {
  const { fields, teams, players, matches, bookings, cities, failed } = data;

  const activeFields = fields.filter((field) => field.isActive !== false);
  const availableFields = activeFields.filter((field) => field.isAvailable !== false);
  const hourlyRevenue = activeFields.reduce((sum, field) => sum + (field.pricePerHour ?? 0), 0);

  const activeTeams = teams.filter((team) => team.isActive !== false);

  const pendingBookings = bookings.filter((booking) => booking.status === "PENDING").length;
  const confirmedBookings = bookings.filter((booking) => booking.status === "CONFIRMED").length;
  const completedBookings = bookings.filter((booking) => booking.status === "COMPLETED").length;
  const bookingsHint =
    bookings.length === 0
      ? "Nenhuma reserva registada"
      : `${confirmedBookings} ${plural(confirmedBookings, "confirmada", "confirmadas")} · ${pendingBookings} ${plural(pendingBookings, "pendente", "pendentes")} · ${completedBookings} ${plural(completedBookings, "concluída", "concluídas")}`;

  const scheduledMatches = matches.filter((match) => match.status === "SCHEDULED").length;
  const liveMatches = matches.filter((match) => match.status === "LIVE").length;
  const finishedMatches = matches.filter((match) => match.status === "FINISHED").length;
  const matchesHint =
    matches.length === 0
      ? "Nenhuma partida registada"
      : `${scheduledMatches} ${plural(scheduledMatches, "agendada", "agendadas")} · ${liveMatches} ${plural(liveMatches, "ao vivo", "ao vivo")} · ${finishedMatches} ${plural(finishedMatches, "concluída", "concluídas")}`;

  const citiesWithFields = new Set(fields.map((field) => field.cityId).filter((id) => id != null)).size;

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <StatCard
        label="Quadras ativas (clientes)"
        value={String(activeFields.length)}
        hint={`${fields.length} ${plural(fields.length, "cadastrada", "cadastradas")} · ${availableFields.length} ${plural(availableFields.length, "disponível", "disponíveis")}`}
        failed={failed.fields}
      />
      <StatCard
        label="Receita potencial por hora"
        value={formatKz(hourlyRevenue)}
        hint="Soma dos preços/hora das quadras ativas"
        failed={failed.fields}
      />
      <StatCard
        label="Times ativos"
        value={String(activeTeams.length)}
        hint={`${players.length} ${plural(players.length, "jogador", "jogadores")} ${plural(players.length, "registado", "registados")}`}
        failed={failed.teams || failed.players}
      />
      <StatCard label="Reservas" value={String(bookings.length)} hint={bookingsHint} failed={failed.bookings} />
      <StatCard label="Partidas" value={String(matches.length)} hint={matchesHint} failed={failed.matches} />
      <StatCard
        label="Cidades cobertas"
        value={String(citiesWithFields)}
        hint={`de ${cities.length} cidades com operação`}
        failed={failed.cities || failed.fields}
      />
    </section>
  );
}
