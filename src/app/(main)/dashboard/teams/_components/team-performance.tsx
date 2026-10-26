import Link from "next/link";

import { ArrowRight, CalendarDays, Trophy } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Match, Team, Tournament, TournamentRegistration, TournamentStanding } from "@/lib/api/types";
import { formatDate, matchStatusLabel, plural } from "@/lib/format";
import { getInitials } from "@/lib/utils";

import { registrationStatusLabel, registrationStatusVariant, tournamentStatusLabel, tournamentStatusVariant } from "./team-labels";

export interface StandingsBlock {
  tournament: Tournament;
  rows: TournamentStanding[];
}

interface TeamPerformanceProps {
  teams: Team[];
  matches: Match[];
  tournaments: Tournament[];
  registrations: TournamentRegistration[];
  /** Classificações já calculadas — a API devolve lista vazia enquanto não forem calculadas. */
  standings: StandingsBlock[];
  failed: boolean;
}

interface TeamRecord {
  teamId: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
}

interface StatProps {
  label: string;
  value: string;
  hint?: string;
  failed?: boolean;
}

function Stat({ label, value, hint, failed = false }: StatProps) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="font-normal text-muted-foreground text-sm">{label}</CardTitle>
        {failed && <span className="text-destructive text-xs">offline</span>}
      </CardHeader>
      <CardContent>
        <div className="text-3xl leading-none tracking-tight tabular-nums">{failed ? "—" : value}</div>
        {hint && !failed && <p className="text-muted-foreground mt-1 text-xs">{hint}</p>}
      </CardContent>
    </Card>
  );
}

function teamLink(team: Team | undefined, teamId: number) {
  if (!team) return <span className="text-muted-foreground">Equipa #{teamId}</span>;
  return (
    <Link
      href={`/dashboard/teams?teamId=${team.id}`}
      className="hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 rounded-md font-medium transition-colors hover:underline focus-visible:outline-none"
    >
      {team.name}
    </Link>
  );
}

/**
 * Histórico e desempenho das equipas: V-E-D por equipa a partir dos jogos
 * terminados, jogos recentes, participação em torneios (inscrições) e as
 * classificações que a API já tenha calculado por torneio.
 */
export function TeamPerformance({ teams, matches, tournaments, registrations, standings, failed }: TeamPerformanceProps) {
  const teamById = new Map(teams.map((team) => [team.id, team]));
  const tournamentById = new Map(tournaments.map((tournament) => [tournament.id, tournament]));

  const finished = matches.filter(
    (match) => match.status === "FINISHED" && match.homeScore != null && match.awayScore != null,
  );
  const upcoming = matches.filter((match) => ["SCHEDULED", "CONFIRMED", "LIVE"].includes(match.status));

  const records = new Map<number, TeamRecord>();
  const blankRecord = (teamId: number): TeamRecord => ({ teamId, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0 });

  for (const match of finished) {
    const home = records.get(match.homeTeamId) ?? blankRecord(match.homeTeamId);
    const away = records.get(match.awayTeamId) ?? blankRecord(match.awayTeamId);
    const homeGoals = match.homeScore ?? 0;
    const awayGoals = match.awayScore ?? 0;

    home.played += 1;
    away.played += 1;
    home.gf += homeGoals;
    home.ga += awayGoals;
    away.gf += awayGoals;
    away.ga += homeGoals;

    if (homeGoals > awayGoals) {
      home.won += 1;
      away.lost += 1;
    } else if (homeGoals < awayGoals) {
      away.won += 1;
      home.lost += 1;
    } else {
      home.drawn += 1;
      away.drawn += 1;
    }

    records.set(match.homeTeamId, home);
    records.set(match.awayTeamId, away);
  }

  const recordRows = [...records.values()]
    .sort((a, b) => b.won - a.won || b.drawn - a.drawn || b.gf - b.ga - (a.gf - a.ga))
    .map((record) => ({ ...record, team: teamById.get(record.teamId) }));

  const recentMatches = [...matches]
    .sort((a, b) => (b.matchDate ?? "").localeCompare(a.matchDate ?? ""))
    .slice(0, 8);

  const registrationsByTournament = new Map<number, TournamentRegistration[]>();
  for (const registration of registrations) {
    const bucket = registrationsByTournament.get(registration.tournamentId) ?? [];
    bucket.push(registration);
    registrationsByTournament.set(registration.tournamentId, bucket);
  }
  const tournamentsWithRegistrations = [...registrationsByTournament.entries()]
    .map(([tournamentId, rows]) => ({ tournament: tournamentById.get(tournamentId), tournamentId, rows }))
    .sort((a, b) => a.tournamentId - b.tournamentId);

  if (failed) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm">— API indisponível: não foi possível carregar o histórico.</CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Stat label="Jogos" value={String(matches.length)} hint="Todos os registos" />
        <Stat label="Terminados" value={String(finished.length)} hint="Com resultado validado" />
        <Stat label="Em curso / marcados" value={String(upcoming.length)} hint="SCHEDULED, CONFIRMED ou LIVE" />
        <Stat label="Torneios" value={String(tournaments.length)} hint="Com inscrições de equipas" />
        <Stat label="Inscrições" value={String(registrations.length)} hint="Pedidos de participação" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Desempenho por equipa</CardTitle>
          <CardDescription>Vitórias, empates e derrotas a partir dos jogos terminados (mais recente primeiro).</CardDescription>
        </CardHeader>
        <CardContent>
          {recordRows.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Trophy />
                </EmptyMedia>
                <EmptyTitle>Sem jogos terminados</EmptyTitle>
                <EmptyDescription>Assim que houver resultados validados, o V-E-D de cada equipa aparece aqui.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Equipa</TableHead>
                  <TableHead className="text-right">PJ</TableHead>
                  <TableHead className="text-right">V</TableHead>
                  <TableHead className="text-right">E</TableHead>
                  <TableHead className="text-right">D</TableHead>
                  <TableHead className="text-right">GM</TableHead>
                  <TableHead className="text-right">GS</TableHead>
                  <TableHead className="text-right">DG</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recordRows.map((row) => (
                  <TableRow key={row.teamId}>
                    <TableCell>
                      <span className="flex items-center gap-2">
                        <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-muted font-medium text-xs">
                          {getInitials(row.team?.name ?? `#${row.teamId}`)}
                        </span>
                        {teamLink(row.team, row.teamId)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{row.played}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.won}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.drawn}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.lost}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.gf}</TableCell>
                    <TableCell className="text-right tabular-nums">{row.ga}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.gf - row.ga > 0 ? `+${row.gf - row.ga}` : row.gf - row.ga}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Jogos recentes</CardTitle>
          <CardDescription>Os últimos 8 jogos registados, do mais recente para o mais antigo.</CardDescription>
        </CardHeader>
        <CardContent>
          {recentMatches.length === 0 ? (
            <p className="text-muted-foreground py-6 text-center text-sm">Sem jogos registados.</p>
          ) : (
            <ul className="divide-y text-sm">
              {recentMatches.map((match) => {
                const home = teamById.get(match.homeTeamId);
                const away = teamById.get(match.awayTeamId);
                const hasScore = match.status === "FINISHED" && match.homeScore != null && match.awayScore != null;
                return (
                  <li key={match.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <p className="truncate font-medium">
                        {home?.name ?? `Equipa #${match.homeTeamId}`}{" "}
                        <span className="text-muted-foreground font-normal">vs</span>{" "}
                        {away?.name ?? `Equipa #${match.awayTeamId}`}
                      </p>
                      <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
                        <CalendarDays className="size-3.5" />
                        {formatDate(match.matchDate)}
                        {match.tournamentId != null && tournamentById.has(match.tournamentId)
                          ? ` · ${tournamentById.get(match.tournamentId)?.name}`
                          : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {hasScore ? (
                        <span className="font-medium text-sm tabular-nums">
                          {match.homeScore} – {match.awayScore}
                        </span>
                      ) : null}
                      <Badge variant="secondary">{matchStatusLabel(match.status)}</Badge>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Participação em torneios</CardTitle>
          <CardDescription>
            {registrations.length} {plural(registrations.length, "inscrição", "inscrições")} de equipas — pendentes e
            decididas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tournamentsWithRegistrations.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Trophy />
                </EmptyMedia>
                <EmptyTitle>Sem inscrições de equipas</EmptyTitle>
                <EmptyDescription>
                  Nenhuma equipa pediu participação em torneios — as inscrições aparecem aqui assim que forem criadas.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="flex flex-col gap-4">
              {tournamentsWithRegistrations.map(({ tournament, tournamentId, rows }) => (
                <div key={tournamentId} className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-sm">{tournament?.name ?? `Torneio #${tournamentId}`}</p>
                    <Badge variant={tournamentStatusVariant(tournament?.status)}>
                      {tournamentStatusLabel(tournament?.status)}
                    </Badge>
                  </div>
                  <ul className="divide-y text-sm">
                    {rows.map((registration) => (
                      <li key={registration.id} className="flex items-center justify-between gap-3 py-2.5">
                        <div className="min-w-0">
                          <p className="truncate">{teamLink(teamById.get(registration.teamId), registration.teamId)}</p>
                          <p className="text-muted-foreground text-xs">
                            Pedido {formatDate(registration.registeredAt)}
                            {registration.rejectionReason ? ` · Motivo: ${registration.rejectionReason}` : ""}
                          </p>
                        </div>
                        <Badge className="shrink-0" variant={registrationStatusVariant(registration.status)}>
                          {registrationStatusLabel(registration.status)}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Classificação</CardTitle>
          <CardDescription>Classificações calculadas por torneio (GET /tournament-standings/:id).</CardDescription>
        </CardHeader>
        <CardContent>
          {standings.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Trophy />
                </EmptyMedia>
                <EmptyTitle>Nenhuma classificação calculada</EmptyTitle>
                <EmptyDescription>
                  A API suporta classificação por torneio, mas ainda não foi calculada para nenhum. O cálculo e a
                  consulta detalhada ficam em Campeonatos → Classificações.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Link
                  href="/dashboard/championships/standings"
                  className="text-primary inline-flex items-center gap-1 text-sm font-medium hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  Ver classificações <ArrowRight />
                </Link>
              </EmptyContent>
            </Empty>
          ) : (
            <div className="flex flex-col gap-5">
              {standings.map(({ tournament, rows }) => (
                <div key={tournament.id} className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-sm">{tournament.name}</p>
                    <Badge variant={tournamentStatusVariant(tournament.status)}>{tournamentStatusLabel(tournament.status)}</Badge>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>Equipa</TableHead>
                        <TableHead className="text-right">PJ</TableHead>
                        <TableHead className="text-right">V</TableHead>
                        <TableHead className="text-right">E</TableHead>
                        <TableHead className="text-right">D</TableHead>
                        <TableHead className="text-right">DG</TableHead>
                        <TableHead className="text-right">Pts</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[...rows]
                        .sort((a, b) => a.position - b.position)
                        .map((row) => (
                          <TableRow key={row.id}>
                            <TableCell className="tabular-nums">{row.position}</TableCell>
                            <TableCell>{teamLink(teamById.get(row.teamId), row.teamId)}</TableCell>
                            <TableCell className="text-right tabular-nums">{row.played}</TableCell>
                            <TableCell className="text-right tabular-nums">{row.wins}</TableCell>
                            <TableCell className="text-right tabular-nums">{row.draws}</TableCell>
                            <TableCell className="text-right tabular-nums">{row.losses}</TableCell>
                            <TableCell className="text-right tabular-nums">
                              {(row.goalDifference ?? row.goalsFor - row.goalsAgainst) > 0
                                ? `+${row.goalDifference ?? row.goalsFor - row.goalsAgainst}`
                                : (row.goalDifference ?? row.goalsFor - row.goalsAgainst)}
                            </TableCell>
                            <TableCell className="text-right font-medium tabular-nums">{row.points}</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-muted-foreground text-xs">
        Nota: a tabela de desempenho não atribui pontos porque as regras (pontos por vitória/empate) são definidas por
        torneio — a classificação oficial com pontos aparece no cartão acima, quando calculada. Equipas sem jogos
        terminados não entram na tabela de V-E-D.
      </p>
    </div>
  );
}
