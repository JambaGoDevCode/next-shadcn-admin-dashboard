"use client";

import { type ReactNode, useCallback, useEffect, useState } from "react";

import { PersonStanding, RefreshCw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import type { Player } from "@/lib/api/types";
import { playerPositionLabel, plural } from "@/lib/format";
import { cn, getInitials } from "@/lib/utils";
import { listTeamPlayersAction } from "@/server/actions/players";

interface TeamRosterCardProps {
  teamId: number;
  teamName: string;
}

/**
 * Plantel de uma equipa (GET /players/team/:teamId) — lista de jogadores com
 * camisa, posição e distinções (capitão/inativo), com recarga independente.
 */
export function TeamRosterCard({ teamId, teamName }: TeamRosterCardProps) {
  const [players, setPlayers] = useState<Player[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey((value) => value + 1), []);

  // Plantel — recarrega no mount, a cada refreshKey e quando a equipa muda.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    listTeamPlayersAction(teamId)
      .then((result) => {
        if (cancelled) return;
        if (result.ok) {
          setPlayers(result.data);
          setError(null);
        } else {
          setPlayers(null);
          setError(result.error);
        }
      })
      .catch(() => {
        if (cancelled) return;
        setPlayers(null);
        setError(`Não foi possível carregar o plantel de ${teamName}.`);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [teamId, teamName, refreshKey]);

  let body: ReactNode;
  if (loading && !players) {
    body = (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton className="h-12 w-full rounded-xl" key={index} />
        ))}
      </div>
    );
  } else if (error) {
    body = (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-8 text-center">
        <p className="text-destructive text-sm">{error}</p>
        <Button onClick={refresh} size="sm" variant="outline">
          Tentar novamente
        </Button>
      </div>
    );
  } else if (!players || players.length === 0) {
    body = (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <PersonStanding />
          </EmptyMedia>
          <EmptyTitle>Sem jogadores no plantel</EmptyTitle>
          <EmptyDescription>Adicione jogadores no ecrã Jogadores.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  } else {
    body = (
      <ul className="flex flex-col gap-1.5">
        {players.map((player) => (
          <li key={player.id} className="flex w-full items-center gap-3 rounded-xl border p-3 text-left">
            <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted font-medium text-xs">
              {getInitials(player.fullName)}
            </div>

            <div className="min-w-0 flex-1">
              <div className="truncate font-medium text-sm leading-tight">{player.fullName}</div>
              <div className="truncate text-muted-foreground text-xs">{player.nickname ?? "—"}</div>
            </div>

            <span className="hidden shrink-0 text-muted-foreground text-xs sm:block">
              {playerPositionLabel(player.position)}
            </span>

            <Badge className="tabular-nums" variant="secondary">
              #{player.jerseyNumber ?? "—"}
            </Badge>

            {player.isCaptain ? <Badge>Capitão</Badge> : null}
            {!player.isActive ? <Badge variant="secondary">Inativo</Badge> : null}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-muted-foreground text-xs">
          {players ? plural(players.length, "jogador", "jogadores") : "—"}
        </p>
        <Button aria-label="Recarregar plantel" disabled={loading} onClick={refresh} size="icon-sm" variant="ghost">
          <RefreshCw className={cn("size-4", loading && "animate-spin")} />
        </Button>
      </div>

      {body}
    </div>
  );
}
