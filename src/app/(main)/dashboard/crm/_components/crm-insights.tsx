import type { ReactNode } from "react";

import { CalendarClock, CheckCircle2, MapPin, TrendingUp, Users, WifiOff } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Booking, City, Field, Player, Team } from "@/lib/api/types";

interface CrmInsightsProps {
  fields: Field[];
  teams: Team[];
  players: Player[];
  bookings: Booking[];
  cities: City[];
}

interface Insight {
  id: string;
  icon: ReactNode;
  title: string;
  hint: string;
  count: number;
  tone: string;
}

const AMBER_TONE =
  "border-amber-300 bg-amber-500/10 text-amber-700 dark:border-amber-900/40 dark:bg-amber-500/15 dark:text-amber-300";
const RED_TONE =
  "border-red-300 bg-red-500/10 text-red-700 dark:border-red-900/40 dark:bg-red-500/15 dark:text-red-300";
const BLUE_TONE =
  "border-blue-300 bg-blue-500/10 text-blue-700 dark:border-blue-900/40 dark:bg-blue-500/15 dark:text-blue-300";

export function CrmInsights({ fields, teams, players, bookings, cities }: CrmInsightsProps) {
  const fieldsWithoutBookings = fields.filter((field) => !bookings.some((booking) => booking.fieldId === field.id));
  const teamsWithoutPlayers = teams.filter(
    (team) => team.isActive !== false && !players.some((player) => player.teamId === team.id),
  );
  const unavailableFields = fields.filter((field) => field.isActive !== false && field.isAvailable === false);
  const citiesWithoutFields = cities.filter((city) => !fields.some((field) => field.cityId === city.id));
  const pendingBookings = bookings.filter((booking) => booking.status === "PENDING");

  const insights: Insight[] = [
    {
      id: "pending-bookings",
      icon: <CalendarClock className="size-4" />,
      title: "Reservas pendentes de confirmação",
      hint: "Clientes aguardando confirmação do dono da quadra.",
      count: pendingBookings.length,
      tone: AMBER_TONE,
    },
    {
      id: "fields-without-bookings",
      icon: <TrendingUp className="size-4" />,
      title: "Quadras sem nenhuma reserva",
      hint: "Potencial de ativação comercial com esses clientes.",
      count: fieldsWithoutBookings.length,
      tone: AMBER_TONE,
    },
    {
      id: "teams-without-players",
      icon: <Users className="size-4" />,
      title: "Times ativos sem jogadores",
      hint: "Times que ainda não registaram jogadores na plataforma.",
      count: teamsWithoutPlayers.length,
      tone: BLUE_TONE,
    },
    {
      id: "unavailable-fields",
      icon: <WifiOff className="size-4" />,
      title: "Quadras indisponíveis",
      hint: "Quadras ativas marcadas como indisponíveis para reserva.",
      count: unavailableFields.length,
      tone: RED_TONE,
    },
    {
      id: "cities-without-fields",
      icon: <MapPin className="size-4" />,
      title: "Cidades sem quadras cadastradas",
      hint: "Oportunidades de expansão da rede de clientes.",
      count: citiesWithoutFields.length,
      tone: BLUE_TONE,
    },
  ].filter((insight) => insight.count > 0);

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Pontos de atenção</CardTitle>
          <CardDescription>Verificações automáticas da carteira para ações comerciais.</CardDescription>
        </div>
        <CardAction>
          <Badge variant="secondary">{insights.length} itens</Badge>
        </CardAction>
      </CardHeader>

      <CardContent>
        {insights.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <CheckCircle2 className="size-8 text-emerald-600/70 dark:text-emerald-400/70" />
            <p className="text-sm">Nenhum ponto de atenção — carteira saudável.</p>
            <p className="text-muted-foreground text-xs">
              Times com jogadores, quadras ativas e nenhuma reserva pendente.
            </p>
          </div>
        ) : (
          <ul className="divide-y">
            {insights.map((insight) => (
              <li key={insight.id} className="flex items-center justify-between gap-3 py-3">
                <div className="flex min-w-0 items-start gap-3">
                  <span
                    className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md border ${insight.tone}`}
                  >
                    {insight.icon}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{insight.title}</p>
                    <p className="text-muted-foreground text-xs">{insight.hint}</p>
                  </div>
                </div>
                <Badge variant="secondary">{insight.count}</Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
