import Link from "next/link";

import { ArrowRight, Crown, ShieldCheck, UsersRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import type { City, Player, RecentUser, Team } from "@/lib/api/types";
import { createCityLabeler, plural, playerPositionLabel } from "@/lib/format";
import { cn, getInitials } from "@/lib/utils";

import { createOwnerLabeler } from "./team-labels";

interface MembersOverviewProps {
  teams: Team[];
  players: Player[];
  cities: City[];
  users: RecentUser[];
  failed: boolean;
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

/**
 * Panorama de membros: plantel por equipa (jogadores, capitães, posição e nº),
 * responsável (owner) e equipas ainda sem jogadores. Visão de consulta — a
 * gestão de membros pertence aos responsáveis de cada equipa.
 */
export function MembersOverview({ teams, players, cities, users, failed }: MembersOverviewProps) {
  const cityLabel = createCityLabeler(cities);
  const ownerLabel = createOwnerLabeler(users);

  const teamById = new Map(teams.map((team) => [team.id, team]));
  const byTeam = new Map<number, Player[]>();
  const orphans: Player[] = [];

  for (const player of players) {
    if (player.teamId != null && teamById.has(player.teamId)) {
      const bucket = byTeam.get(player.teamId) ?? [];
      bucket.push(player);
      byTeam.set(player.teamId, bucket);
    } else {
      orphans.push(player);
    }
  }

  const captains = players.filter((player) => player.isCaptain).length;
  const teamsWithMembers = teams.filter((team) => (byTeam.get(team.id)?.length ?? 0) > 0);
  const teamsWithoutMembers = teams.filter((team) => (byTeam.get(team.id)?.length ?? 0) === 0);

  function rosterRows(roster: Player[]) {
    return (
      <ul className="divide-y text-sm">
        {[...roster]
          .sort((a, b) => Number(b.isCaptain ?? false) - Number(a.isCaptain ?? false) || a.fullName.localeCompare(b.fullName))
          .map((player) => (
            <li key={player.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className={cn(
                    "grid size-8 shrink-0 place-items-center rounded-lg border font-medium text-xs tabular-nums",
                    player.isCaptain ? "border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-300" : "bg-muted text-muted-foreground",
                  )}
                >
                  {player.jerseyNumber ?? "—"}
                </span>
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 truncate font-medium">
                    {player.fullName}
                    {player.isCaptain && <Crown className="size-3.5 shrink-0 text-amber-500" aria-label="Capitão" />}
                  </p>
                  <p className="text-muted-foreground truncate text-xs">
                    {playerPositionLabel(player.position)}
                    {player.nickname ? ` · «${player.nickname}»` : ""}
                    {` · ${player.matchesPlayed ?? 0} ${plural(player.matchesPlayed ?? 0, "jogo", "jogos")}`}
                  </p>
                </div>
              </div>
              {player.isCaptain ? (
                <Badge className="shrink-0" variant="secondary">
                  Capitão
                </Badge>
              ) : null}
            </li>
          ))}
      </ul>
    );
  }

  if (failed) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm">— API indisponível: não foi possível carregar os membros.</CardContent>
      </Card>
    );
  }

  if (players.length === 0) {
    return (
      <Card>
        <CardContent className="py-6">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <UsersRound />
              </EmptyMedia>
              <EmptyTitle>Sem jogadores registados</EmptyTitle>
              <EmptyDescription>
                A plataforma ainda não tem jogadores associados a equipas — os membros aparecem aqui assim que forem
                criados.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Jogadores" value={String(players.length)} hint="Todos os registos de jogadores" />
        <Stat label="Equipas com membros" value={String(teamsWithMembers.length)} hint={`De ${teams.length} ${plural(teams.length, "equipa", "equipas")}`} />
        <Stat label="Capitães" value={String(captains)} hint="Jogadores com insígnia de capitão" />
        <Stat label="Equipas sem membros" value={String(teamsWithoutMembers.length)} hint="Plantel vazio" />
      </div>

      <div className="flex flex-col gap-4">
        {teamsWithMembers.map((team) => (
          <Card key={team.id}>
            <CardHeader className="border-b has-data-[slot=card-action]:grid-cols-1 md:has-data-[slot=card-action]:grid-cols-[1fr_auto]">
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted font-medium text-xs">
                  {getInitials(team.name)}
                </span>
                <span className="truncate">{team.name}</span>
                {team.isActive === false && <Badge variant="destructive">Inactiva</Badge>}
              </CardTitle>
              <CardDescription>
                {cityLabel(team.cityId)} · Responsável: {ownerLabel(team.ownerId)} ·{" "}
                {byTeam.get(team.id)?.length ?? 0} {plural(byTeam.get(team.id)?.length ?? 0, "membro", "membros")}
              </CardDescription>
              <CardAction className="col-start-1 row-start-auto justify-self-start md:col-start-2 md:row-span-2 md:row-start-1 md:justify-self-end">
                <Link
                  href={`/dashboard/teams?teamId=${team.id}`}
                  aria-label={`Consultar a equipa ${team.name}`}
                  className="text-muted-foreground rounded-md p-1.5 transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  <ArrowRight />
                </Link>
              </CardAction>
            </CardHeader>
            <CardContent>{rosterRows(byTeam.get(team.id) ?? [])}</CardContent>
          </Card>
        ))}
      </div>

      {orphans.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Jogadores sem equipa</CardTitle>
            <CardDescription>Registos sem `teamId` ou apontando para uma equipa inexistente.</CardDescription>
          </CardHeader>
          <CardContent>{rosterRows(orphans)}</CardContent>
        </Card>
      )}

      {teamsWithoutMembers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Equipas sem membros</CardTitle>
            <CardDescription>Plantel vazio — a inscrição de jogadores é feita pelo responsável de cada equipa.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-wrap gap-2">
              {teamsWithoutMembers.map((team) => (
                <li key={team.id}>
                  <Link
                    href={`/dashboard/teams?teamId=${team.id}`}
                    className="hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors focus-visible:outline-none"
                  >
                    <ShieldCheck className="size-3.5 text-muted-foreground" />
                    {team.name}
                    <span className="text-muted-foreground text-xs">{cityLabel(team.cityId)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <p className="text-muted-foreground text-xs">
        Consulta administrativa: a gestão normal dos membros (convites, entrada e saída de jogadores, capitães)
        continua a pertencer aos responsáveis de cada equipa — a administração usa este ecrã para consultar
        composição e resolver conflitos. Nota: a API não expõe campo de «responsável/técnico» na equipa, por isso o
        responsável apresentado é o proprietário da conta (`ownerId`).
      </p>
    </div>
  );
}
