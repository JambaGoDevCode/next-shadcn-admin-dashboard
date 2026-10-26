"use client";

import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { City, Player, Team } from "@/lib/api/types";
import { listCitiesAction, listTeamsAction } from "@/server/actions/management";
import { listPlayersAction } from "@/server/actions/players";

import { PlayerDetailsCard } from "./player-details-card";
import { PlayersListCard } from "./players-list-card";

/**
 * Gestão de jogadores: lista filtrável (GET /players), seleção de linha e cartão
 * de detalhe com edição (PUT), capitania e exclusão definitiva (hard delete).
 */
export function PlayersAdmin() {
  const [players, setPlayers] = useState<Player[] | null>(null);
  const [playersError, setPlayersError] = useState<string | null>(null);
  const [playersLoading, setPlayersLoading] = useState(true);
  const [teams, setTeams] = useState<Team[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const detailsRef = useRef<HTMLDivElement>(null);
  /** Último jogador criado — a auto-seleção deve escolhê-lo de novo após a recarga. */
  const createdIdRef = useRef<string | null>(null);

  const refresh = useCallback(() => setRefreshKey((value) => value + 1), []);

  // Jogadores + referências (equipas/cidades) — recarrega no mount e a cada refreshKey.
  useEffect(() => {
    let cancelled = false;
    setPlayersLoading(true);

    Promise.all([listPlayersAction(), listTeamsAction(), listCitiesAction()])
      .then(([playersResult, teamsResult, citiesResult]) => {
        if (cancelled) return;
        if (playersResult.ok) {
          setPlayers(playersResult.data);
          setPlayersError(null);
        } else {
          setPlayers(null);
          setPlayersError(playersResult.error);
        }
        setTeams(teamsResult.ok ? teamsResult.data : []);
        setCities(citiesResult.ok ? citiesResult.data : []);
      })
      .catch(() => {
        if (cancelled) return;
        setPlayers(null);
        setPlayersError("Não foi possível carregar os jogadores.");
        setTeams([]);
        setCities([]);
      })
      .finally(() => {
        if (!cancelled) setPlayersLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  // Seleciona o jogador recém-criado (ou o primeiro) quando nada está selecionado.
  useEffect(() => {
    if (!players || players.length === 0 || selectedId !== null) return;

    const createdId = createdIdRef.current;
    if (createdId) {
      const created = players.find((player) => player.id === createdId);
      // A recarga ainda não trouxe o novo jogador — espera o próximo efeito.
      if (!created) return;
      createdIdRef.current = null;
      setSelectedId(created.id);
      return;
    }

    setSelectedId(players[0].id);
  }, [players, selectedId]);

  const selectedPlayer = players?.find((player) => player.id === selectedId) ?? null;

  const handleSelect = useCallback((player: Player) => {
    setSelectedId(player.id);
    detailsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  /** Criado o jogador (diálogo) — a lista recarrega e a auto-seleção escolhe o novo. */
  const handleCreated = useCallback(
    (playerId: string) => {
      createdIdRef.current = playerId;
      setSelectedId(null);
      refresh();
    },
    [refresh],
  );

  const handleUpdated = useCallback((player: Player) => {
    setPlayers((current) => (current ? current.map((row) => (row.id === player.id ? player : row)) : current));
  }, []);

  /** Exclusão (hard delete) — a API remove o jogador da listagem; a seleção avança para o vizinho. */
  const handleDeleted = useCallback(
    (playerId: string) => {
      if (!players) return;
      const index = players.findIndex((player) => player.id === playerId);
      const remaining = players.filter((player) => player.id !== playerId);
      const neighbor = remaining[Math.min(index, remaining.length - 1)] ?? null;
      setPlayers(remaining);
      setSelectedId(neighbor ? neighbor.id : null);
    },
    [players],
  );

  /** Capitania alterada — a API pode rebaixar o capitão anterior; recarrega mantendo a seleção. */
  const handleCaptainChanged = useCallback(() => {
    refresh();
  }, [refresh]);

  let details: ReactNode;
  if (selectedPlayer) {
    details = (
      <Card key={`details-${selectedPlayer.id}`}>
        <CardHeader>
          <CardTitle>Detalhes</CardTitle>
          <CardDescription>Estatísticas, estado e ações do jogador.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <PlayerDetailsCard
            player={selectedPlayer}
            teams={teams}
            cities={cities}
            onChanged={handleUpdated}
            onDeleted={handleDeleted}
            onCaptainChanged={handleCaptainChanged}
          />
        </CardContent>
      </Card>
    );
  } else if (playersLoading) {
    details = <Skeleton className="h-48 w-full" />;
  } else {
    details = null;
  }

  return (
    <div className="flex flex-col gap-4">
      <PlayersListCard
        cities={cities}
        error={playersError}
        loading={playersLoading}
        onCreated={handleCreated}
        onRefresh={refresh}
        onRetry={refresh}
        onSelect={handleSelect}
        players={players}
        selectedPlayerId={selectedId}
        teams={teams}
      />

      <div className="flex flex-col gap-4" ref={detailsRef}>
        {details}
      </div>
    </div>
  );
}
