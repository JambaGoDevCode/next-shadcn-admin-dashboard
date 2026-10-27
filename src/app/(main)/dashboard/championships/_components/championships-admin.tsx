"use client";

import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { City, RecentUser, SportModality, Team, Tournament } from "@/lib/api/types";
import { listSportModalitiesAction, listTournamentsAction } from "@/server/actions/championships";
import { listCitiesAction, listTeamsAction } from "@/server/actions/management";
import { listUsersAction } from "@/server/actions/users";

import { ChampionshipDetailsCard } from "./championship-details-card";
import { ChampionshipRegistrationsCard } from "./championship-registrations-card";
import { ChampionshipStandingsCard } from "./championship-standings-card";
import { ChampionshipsListCard } from "./championships-list-card";

/**
 * Gestão de campeonatos: lista filtrável (GET /tournaments), seleção de linha e a
 * pilha de detalhe com ciclo de vida de estado, inscrições e classificação.
 */
export function ChampionshipsAdmin({ approvalOnly = false }: { approvalOnly?: boolean }) {
  const [tournaments, setTournaments] = useState<Tournament[] | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [listLoading, setListLoading] = useState(true);
  const [teams, setTeams] = useState<Team[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [modalities, setModalities] = useState<SportModality[]>([]);
  const [organizers, setOrganizers] = useState<{ id: number; name: string }[]>([]);
  const [organizerOptions, setOrganizerOptions] = useState<{ id: number; name: string }[]>([]);
  const [_refreshKey, setRefreshKey] = useState(0);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const detailsRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(() => setRefreshKey((value) => value + 1), []);

  // Campeonatos + referência de equipas — recarrega no mount e a cada refreshKey.
  useEffect(() => {
    let cancelled = false;
    setListLoading(true);

    Promise.all([
      listTournamentsAction(),
      listTeamsAction(),
      listCitiesAction(),
      listSportModalitiesAction(),
      listUsersAction(100, "ORGANIZER"),
    ])
      .then(([tournamentsResult, teamsResult, citiesResult, modalitiesResult, organizersResult]) => {
        if (cancelled) return;
        if (tournamentsResult.ok) {
          setTournaments(tournamentsResult.data);
          setListError(null);
        } else {
          setTournaments(null);
          setListError(tournamentsResult.error);
        }
        setTeams(teamsResult.ok ? teamsResult.data : []);
        setCities(citiesResult.ok ? citiesResult.data : []);
        setModalities(modalitiesResult.ok ? modalitiesResult.data : []);
        const users: RecentUser[] = organizersResult.ok ? organizersResult.data : [];
        setOrganizers(users.map(({ id, name }) => ({ id, name })));
        setOrganizerOptions(users.filter((user) => user.status === "ACTIVE").map(({ id, name }) => ({ id, name })));
      })
      .catch(() => {
        if (cancelled) return;
        setTournaments(null);
        setListError("Não foi possível carregar os campeonatos.");
        setTeams([]);
        setCities([]);
        setModalities([]);
        setOrganizers([]);
        setOrganizerOptions([]);
      })
      .finally(() => {
        if (!cancelled) setListLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Seleciona o primeiro campeonato quando nada está selecionado.
  useEffect(() => {
    if (!tournaments || selectedId !== null) return;
    const firstAvailable = approvalOnly
      ? tournaments.find((tournament) => tournament.status === "DRAFT")
      : tournaments[0];
    if (firstAvailable) setSelectedId(firstAvailable.id);
  }, [tournaments, selectedId, approvalOnly]);

  const selectedTournament = tournaments?.find((tournament) => tournament.id === selectedId) ?? null;

  const handleSelect = useCallback((tournament: Tournament) => {
    setSelectedId(tournament.id);
    detailsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  /** Criado o campeonato (diálogo) — entra no topo da lista e fica selecionado. */
  const handleCreated = useCallback(
    (tournament: Tournament) => {
      setTournaments((current) =>
        current ? [tournament, ...current.filter((row) => row.id !== tournament.id)] : [tournament],
      );
      setSelectedId(tournament.id);
      refresh();
    },
    [refresh],
  );

  const handleUpdated = useCallback(
    (tournament: Tournament) => {
      setTournaments((current) =>
        current ? current.map((row) => (row.id === tournament.id ? tournament : row)) : current,
      );
      if (approvalOnly && tournament.status !== "DRAFT") setSelectedId(null);
    },
    [approvalOnly],
  );

  /** Exclusão — a API remove o campeonato da listagem; a seleção avança para o vizinho. */
  const handleDeleted = useCallback(
    (tournamentId: number) => {
      if (!tournaments) return;
      const index = tournaments.findIndex((tournament) => tournament.id === tournamentId);
      const remaining = tournaments.filter((tournament) => tournament.id !== tournamentId);
      const neighbor = remaining[Math.min(index, remaining.length - 1)] ?? null;
      setTournaments(remaining);
      setSelectedId(neighbor ? neighbor.id : null);
    },
    [tournaments],
  );

  let details: ReactNode;
  if (selectedTournament) {
    details = (
      <>
        <Card key={`details-${selectedTournament.id}`}>
          <CardHeader>
            <CardTitle>Campeonato</CardTitle>
            <CardDescription>Dados, regras e ciclo de vida.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <ChampionshipDetailsCard
              tournament={selectedTournament}
              teams={teams}
              cities={cities}
              modalities={modalities}
              organizers={organizers}
              organizerOptions={organizerOptions}
              onChanged={handleUpdated}
              onDeleted={handleDeleted}
            />
          </CardContent>
        </Card>

        {!approvalOnly && (
          <Card key={`registrations-${selectedTournament.id}`}>
            <CardHeader>
              <CardTitle>Inscrições</CardTitle>
              <CardDescription>Equipas inscritas e aprovações.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <ChampionshipRegistrationsCard tournamentId={selectedTournament.id} teams={teams} />
            </CardContent>
          </Card>
        )}

        {!approvalOnly && (
          <Card key={`standings-${selectedTournament.id}`}>
            <CardHeader>
              <CardTitle>Classificação</CardTitle>
              <CardDescription>Tabela de classificação do campeonato.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <ChampionshipStandingsCard tournamentId={selectedTournament.id} teams={teams} />
            </CardContent>
          </Card>
        )}
      </>
    );
  } else if (listLoading) {
    details = (
      <>
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-40 w-full" />
      </>
    );
  } else {
    details = null;
  }

  return (
    <div className="flex flex-col gap-4">
      <ChampionshipsListCard
        approvalOnly={approvalOnly}
        cities={cities}
        error={listError}
        loading={listLoading}
        modalities={modalities}
        organizers={organizers}
        onCreated={handleCreated}
        onRefresh={refresh}
        onRetry={refresh}
        onSelect={handleSelect}
        selectedTournamentId={selectedId}
        tournaments={tournaments}
      />

      <div className="flex flex-col gap-4" ref={detailsRef}>
        {details}
      </div>
    </div>
  );
}
