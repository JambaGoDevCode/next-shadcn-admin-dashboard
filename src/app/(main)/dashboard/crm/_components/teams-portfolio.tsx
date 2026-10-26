import { Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { City, Match, Player, Team } from "@/lib/api/types";
import { createCityLabeler } from "@/lib/format";

interface TeamsPortfolioProps {
  teams: Team[];
  cities: City[];
  players: Player[];
  matches: Match[];
  failed: boolean;
}

export function TeamsPortfolio({ teams, cities, players, matches, failed }: TeamsPortfolioProps) {
  const cityLabel = createCityLabeler(cities);

  const rows = teams
    .map((team) => ({
      team,
      players: players.filter((player) => player.teamId === team.id).length,
      matches: matches.filter((match) => match.homeTeamId === team.id || match.awayTeamId === team.id).length,
    }))
    .sort((a, b) => b.players - a.players || b.matches - a.matches || a.team.name.localeCompare(b.team.name));

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Times clientes</CardTitle>
          <CardDescription>Equipas que reservam quadras — a demanda da plataforma.</CardDescription>
        </div>
        <CardAction>
          <Badge variant="secondary">{teams.length} times</Badge>
        </CardAction>
      </CardHeader>

      <CardContent>
        {failed ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-red-300 bg-red-500/10 px-4 py-10 text-center dark:border-red-900/40">
            <p className="font-medium text-red-700 dark:text-red-300">Não foi possível carregar os times.</p>
            <p className="text-red-700/80 text-xs dark:text-red-300/80">
              Verifique se a API está em execução e tente novamente.
            </p>
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <Users className="size-8 text-muted-foreground/50" />
            <p className="text-muted-foreground text-sm">Nenhum time cadastrado ainda.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Cidade</TableHead>
                <TableHead className="text-right">Jogadores</TableHead>
                <TableHead className="text-right">Partidas</TableHead>
                <TableHead>Proprietário</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ team, players: playerCount, matches: matchCount }) => (
                <TableRow key={team.id}>
                  <TableCell className="font-medium">{team.name}</TableCell>
                  <TableCell className="text-muted-foreground">{cityLabel(team.cityId)}</TableCell>
                  <TableCell className="text-right">{playerCount}</TableCell>
                  <TableCell className="text-right">{matchCount}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {team.ownerId != null ? `#${team.ownerId}` : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        team.isActive === false
                          ? "border-red-300 bg-red-500/10 text-red-700 dark:border-red-900/40 dark:bg-red-500/15 dark:text-red-300"
                          : "border-emerald-300 bg-emerald-500/10 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-500/15 dark:text-emerald-300"
                      }
                    >
                      {team.isActive === false ? "Inativo" : "Ativo"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
