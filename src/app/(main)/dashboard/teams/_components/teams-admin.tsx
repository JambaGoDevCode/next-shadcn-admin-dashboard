"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { City, RecentUser, Team } from "@/lib/api/types";
import { listAllTeamsAction, listCitiesAction } from "@/server/actions/management";
import { listUsersAction } from "@/server/actions/users";

import { TeamDetailsCard } from "./team-details-card";
import { TeamRosterCard } from "./team-roster-card";
import { TeamsListCard } from "./teams-list-card";

interface TeamsAdminProps {
  /** Equipa pré-selecionada via deep link `?teamId=` (vindo de Membros, Estado ou Histórico). */
  initialTeamId?: number;
}

/**
 * Gestão de equipas: lista filtrável (activas + inactivas), seleção de linha e
 * cartões de detalhe (PUT/DELETE) e de plantel (GET /players/team/:teamId).
 */
export function TeamsAdmin({ initialTeamId }: TeamsAdminProps) {
  const [teams, setTeams] = useState<Team[] | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [listLoading, setListLoading] = useState(true);
  const [cities, setCities] = useState<City[]>([]);
  const [users, setUsers] = useState<RecentUser[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const detailsRef = useRef<HTMLDivElement>(null);
  /** Deep link `?teamId=` já carregado. */
  const initialLoadedRef = useRef(false);

  const refresh = useCallback(() => setRefreshKey((value) => value + 1), []);

  // Equipas (activas + inactivas) + cidades/usuarios (referência) — recarrega no mount e a cada refreshKey.
  useEffect(() => {
    let cancelled = false;
    setListLoading(true);

    listAllTeamsAction()
      .then((result) => {
        if (cancelled) return;
        if (result.ok) {
          setTeams(result.data);
          setListError(null);
        } else {
          setTeams(null);
          setListError(result.error);
        }
      })
      .catch(() => {
        if (cancelled) return;
        setTeams(null);
        setListError("Não foi possível carregar as equipas.");
      })
      .finally(() => {
        if (!cancelled) setListLoading(false);
      });

    // Dados de referência: falhas não quebram o ecrã — os rótulos ficam «—».
    listCitiesAction()
      .then((result) => {
        if (!cancelled) setCities(result.ok ? result.data : []);
      })
      .catch(() => {
        if (!cancelled) setCities([]);
      });

    listUsersAction(100)
      .then((result) => {
        if (!cancelled) setUsers(result.ok ? result.data : []);
      })
      .catch(() => {
        if (!cancelled) setUsers([]);
      });

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  // Seleciona a primeira equipa quando nada está selecionado.
  useEffect(() => {
    if (!teams || teams.length === 0 || selectedId !== null) return;
    setSelectedId(teams[0].id);
  }, [teams, selectedId]);

  // Deep link `?teamId=` — seleciona a equipa pedida (uma única vez).
  useEffect(() => {
    if (initialTeamId === undefined || initialLoadedRef.current) return;
    initialLoadedRef.current = true;
    setSelectedId(initialTeamId);
    detailsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [initialTeamId]);

  const selectedTeam = teams?.find((team) => team.id === selectedId) ?? null;

  const handleSelect = useCallback((team: Team) => {
    setSelectedId(team.id);
    detailsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  /** Equipa criada (diálogo) — entra no topo da lista e fica selecionada. */
  const handleCreated = useCallback(
    (team: Team) => {
      setTeams((current) => (current ? [team, ...current.filter((row) => row.id !== team.id)] : [team]));
      setSelectedId(team.id);
      refresh();
    },
    [refresh],
  );

  const handleUpdated = useCallback((team: Team) => {
    setTeams((current) => (current ? current.map((row) => (row.id === team.id ? team : row)) : current));
  }, []);

  /** Exclusão — a API remove a equipa da listagem; a seleção avança para o vizinho seguinte. */
  const handleDeleted = useCallback(
    (teamId: number) => {
      if (!teams) return;
      const index = teams.findIndex((team) => team.id === teamId);
      const remaining = teams.filter((team) => team.id !== teamId);
      const neighbor = remaining[Math.min(index, remaining.length - 1)] ?? null;
      setTeams(remaining);
      setSelectedId(neighbor ? neighbor.id : null);
    },
    [teams],
  );

  return (
    <div className="flex flex-col gap-4">
      <TeamsListCard
        cities={cities}
        error={listError}
        loading={listLoading}
        onCreated={handleCreated}
        onRefresh={refresh}
        onRetry={refresh}
        onSelect={handleSelect}
        selectedTeamId={selectedId}
        teams={teams}
        users={users}
      />

      <div className="flex flex-col gap-4" ref={detailsRef}>
        {selectedTeam ? (
          <>
            <Card key={`details-${selectedTeam.id}`}>
              <CardHeader>
                <CardTitle>Detalhes</CardTitle>
                <CardDescription>Dados da equipa e ações de gestão.</CardDescription>
              </CardHeader>
              <CardContent>
                <TeamDetailsCard
                  cities={cities}
                  team={selectedTeam}
                  users={users}
                  onChanged={handleUpdated}
                  onDeleted={handleDeleted}
                />
              </CardContent>
            </Card>

            <Card key={`roster-${selectedTeam.id}`}>
              <CardHeader>
                <CardTitle>Plantel</CardTitle>
                <CardDescription>Jogadores registados nesta equipa.</CardDescription>
              </CardHeader>
              <CardContent>
                <TeamRosterCard teamId={selectedTeam.id} teamName={selectedTeam.name} />
              </CardContent>
            </Card>
          </>
        ) : listLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : null}
      </div>
    </div>
  );
}
