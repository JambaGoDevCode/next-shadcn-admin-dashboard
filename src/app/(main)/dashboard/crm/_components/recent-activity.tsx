import type { ReactNode } from "react";

import { CalendarX2, Trophy } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Booking, Field, Match, Team } from "@/lib/api/types";
import { bookingStatusLabel, formatDateTime, formatKz, matchStatusLabel, statusTone } from "@/lib/format";

interface RecentActivityProps {
  matches: Match[];
  bookings: Booking[];
  teams: Team[];
  fields: Field[];
}

function EmptyRow({ icon, message }: { icon: ReactNode; message: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-8 text-center">
      {icon}
      <p className="text-muted-foreground text-sm">{message}</p>
    </div>
  );
}

export function RecentActivity({ matches, bookings, teams, fields }: RecentActivityProps) {
  const teamName = (id: number) => teams.find((team) => team.id === id)?.name ?? `Time #${id}`;
  const fieldName = (id: number) => fields.find((field) => field.id === id)?.name ?? `Quadra #${id}`;

  const recentMatches = [...matches]
    .filter((match) => match.matchDate)
    .sort((a, b) => (b.matchDate ?? "").localeCompare(a.matchDate ?? ""))
    .slice(0, 5);

  const recentBookings = [...bookings]
    .filter((booking) => booking.startTime)
    .sort((a, b) => (b.startTime ?? "").localeCompare(a.startTime ?? ""))
    .slice(0, 5);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Partidas recentes</CardTitle>
            <CardDescription>Últimas partidas agendadas ou em andamento.</CardDescription>
          </div>
          <CardAction>
            <Badge variant="secondary">{matches.length} no total</Badge>
          </CardAction>
        </CardHeader>
        <CardContent>
          {recentMatches.length === 0 ? (
            <EmptyRow
              icon={<Trophy className="size-8 text-muted-foreground/50" />}
              message="Nenhuma partida com data registada."
            />
          ) : (
            <ul className="divide-y">
              {recentMatches.map((match) => (
                <li key={match.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {teamName(match.homeTeamId)} <span className="text-muted-foreground">vs</span>{" "}
                      {teamName(match.awayTeamId)}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {fieldName(match.fieldId ?? -1)} · {formatDateTime(match.matchDate)}
                    </p>
                  </div>
                  <Badge variant="outline" className={statusTone(match.status)}>
                    {matchStatusLabel(match.status)}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Reservas recentes</CardTitle>
            <CardDescription>Últimas reservas de quadras registradas na plataforma.</CardDescription>
          </div>
          <CardAction>
            <Badge variant="secondary">{bookings.length} no total</Badge>
          </CardAction>
        </CardHeader>
        <CardContent>
          {recentBookings.length === 0 ? (
            <EmptyRow
              icon={<CalendarX2 className="size-8 text-muted-foreground/50" />}
              message="Nenhuma reserva registada ainda."
            />
          ) : (
            <ul className="divide-y">
              {recentBookings.map((booking) => (
                <li key={booking.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{fieldName(booking.fieldId)}</p>
                    <p className="text-muted-foreground text-xs">
                      {formatDateTime(booking.startTime)} — {formatDateTime(booking.endTime)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {booking.totalPrice != null && (
                      <span className="text-sm font-medium">{formatKz(booking.totalPrice)}</span>
                    )}
                    <Badge variant="outline" className={statusTone(booking.status)}>
                      {bookingStatusLabel(booking.status)}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
