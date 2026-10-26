"use server";

import {
  acceptMatchmaking,
  cancelMatch,
  createMatch,
  deleteMatch,
  findMatch,
  finishMatch,
  getCities,
  getFields,
  getMatch,
  getMatchmakingRecommendations,
  getMatches,
  getPlayers,
  getTeams,
  rejectMatchmaking,
  rescheduleMatch,
  scheduleMatches,
  startMatch,
  updateMatchScore,
} from "@/lib/api/resources";
import type {
  City,
  CityInfo,
  Field,
  Match,
  MatchDetail,
  MatchmakingMatch,
  MatchmakingRecommendation,
  MatchmakingRecommendationRow,
  MatchSimple,
  Player,
  Team,
  TeamSummary,
} from "@/lib/api/types";
import { getSessionTokens } from "@/lib/auth/session";

export type LogisticsMatchesResult =
  | { ok: true; data: MatchSimple[] }
  | { ok: false; error: string };

export type LogisticsMatchDetailResult =
  | { ok: true; data: MatchDetail }
  | { ok: false; error: string };

/** Resultado uniforme das ações de escrita (CRUD, matchmaking e realtime). */
export type LogisticsActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

/** Corre uma chamada à API com a sessão atual e converte erros em resultado tipado. */
async function runWithSession<T>(run: (token: string) => Promise<T>): Promise<LogisticsActionResult<T>> {
  try {
    const { accessToken } = await getSessionTokens();
    const data = await run(accessToken ?? "");
    return { ok: true, data };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Ocorreu um erro inesperado. Tente novamente.",
    };
  }
}

/** `/players` devolve a entidade aninhada (`core.*`) — achata para o view-model plano. */
function flattenPlayer(player: Player): Player {
  const core = (player as unknown as { core?: Player }).core;
  return core ? { ...player, ...core } : player;
}

export async function listLogisticsMatchesAction(): Promise<LogisticsMatchesResult> {
  try {
    const { accessToken } = await getSessionTokens();
    const token = accessToken ?? "";
    const [matches, teams, fields, cities] = await Promise.all([
      getMatches(token),
      getTeams(token).catch(() => []),
      getFields(token).catch(() => []),
      getCities(token).catch(() => []),
    ]);

    const teamNames = new Map(teams.map((team) => [team.id, team.name]));
    const fieldNames = new Map(fields.map((field) => [field.id, field.name]));
    const cityNames = new Map(cities.map((city) => [city.id, city.name]));

    return {
      ok: true,
      data: matches.map((match) => ({
        id: match.id,
        homeTeamId: match.homeTeamId,
        awayTeamId: match.awayTeamId,
        fieldId: match.fieldId ?? null,
        cityId: match.cityId ?? null,
        tournamentId: match.tournamentId ?? null,
        status: match.status as MatchSimple["status"],
        matchDate: match.matchDate ? new Date(match.matchDate).toISOString() : "",
        homeScore: match.homeScore ?? null,
        awayScore: match.awayScore ?? null,
        homeTeamName: teamNames.get(match.homeTeamId) ?? `Equipa #${match.homeTeamId}`,
        awayTeamName: teamNames.get(match.awayTeamId) ?? `Equipa #${match.awayTeamId}`,
        fieldName: match.fieldId == null ? null : (fieldNames.get(match.fieldId) ?? null),
        cityName: match.cityId == null ? null : (cityNames.get(match.cityId) ?? null),
      })),
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Não foi possível carregar as partidas.",
    };
  }
}

export async function getLogisticsMatchDetailAction(matchId: number): Promise<LogisticsMatchDetailResult> {
  try {
    const { accessToken } = await getSessionTokens();
    const token = accessToken ?? "";

    const [match, teams, fields, cities, players] = await Promise.all([
      getMatch(token, matchId),
      getTeams(token).catch(() => []),
      getFields(token).catch(() => []),
      getCities(token).catch(() => []),
      getPlayers(token).catch(() => [] as Player[]),
    ]);

    const teamNames = new Map(teams.map((team) => [team.id, team.name]));
    const cityNames = new Map(cities.map((city) => [city.id, city.name]));
    const field = fields.find((item) => item.id === match.fieldId) ?? null;
    const homeTeamId = match.homeTeamId;
    const awayTeamId = match.awayTeamId;

    const toSummary = (teamId: number): TeamSummary => {
      const team = teams.find((item) => item.id === teamId);
      return {
        id: teamId,
        name: team?.name ?? `Equipa #${teamId}`,
        cityName: team?.cityId != null ? (cityNames.get(team.cityId) ?? null) : null,
        logo: team?.logo ?? null,
        isActive: team?.isActive ?? true,
      };
    };

    const squad = players
      .map(flattenPlayer)
      .filter((player) => player.teamId === homeTeamId || player.teamId === awayTeamId)
      .map((player) => ({
        id: player.id,
        fullName: player.fullName,
        position: player.position ?? null,
        jerseyNumber: player.jerseyNumber ?? null,
        teamId: player.teamId ?? null,
        teamName: teamNames.get(player.teamId ?? -1) ?? undefined,
      }));

    const cityId = match.cityId ?? field?.cityId ?? teams.find((item) => item.id === homeTeamId)?.cityId ?? null;
    const city: CityInfo | null =
      cityId != null
        ? {
            id: cityId,
            name: cityNames.get(cityId) ?? `Cidade #${cityId}`,
            teams: teams.filter((item) => item.cityId === cityId),
            fields: fields
              .filter((item) => item.cityId === cityId)
              .map((item) => ({
                id: item.id,
                name: item.name,
                address: item.address ?? null,
                cityName: cityNames.get(cityId) ?? null,
                pricePerHour: item.pricePerHour ?? null,
                isAvailable: item.isAvailable ?? true,
              })),
          }
        : null;

    return {
      ok: true,
      data: {
        match: {
          id: match.id,
          homeTeamId,
          awayTeamId,
          fieldId: match.fieldId ?? null,
          cityId: match.cityId ?? null,
          tournamentId: match.tournamentId ?? null,
          status: match.status as MatchSimple["status"],
          matchDate: match.matchDate ? new Date(match.matchDate).toISOString() : "",
          homeScore: match.homeScore ?? null,
          awayScore: match.awayScore ?? null,
          homeTeamName: teamNames.get(homeTeamId) ?? `Equipa #${homeTeamId}`,
          awayTeamName: teamNames.get(awayTeamId) ?? `Equipa #${awayTeamId}`,
          fieldName: field?.name ?? null,
          cityName: match.cityId == null ? null : (cityNames.get(match.cityId) ?? null),
        },
        homeTeam: toSummary(homeTeamId),
        awayTeam: toSummary(awayTeamId),
        field: field
          ? {
              id: field.id,
              name: field.name,
              address: field.address ?? null,
              cityName: field.cityId != null ? (cityNames.get(field.cityId) ?? null) : null,
              pricePerHour: field.pricePerHour ?? null,
              isAvailable: field.isAvailable ?? true,
            }
          : null,
        players: squad,
        city,
      },
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Não foi possível carregar os detalhes da partida.",
    };
  }
}

// ---------------------------------------------------------------------------
// Dados de referência para os diálogos (equipas, campos e cidades)
// ---------------------------------------------------------------------------

export async function getMatchReferenceDataAction(): Promise<
  LogisticsActionResult<{ teams: Team[]; fields: Field[]; cities: City[] }>
> {
  return runWithSession(async (token) => {
    const [teams, fields, cities] = await Promise.all([getTeams(token), getFields(token), getCities(token)]);
    return { teams, fields, cities };
  });
}

// ---------------------------------------------------------------------------
// CRUD das partidas
// ---------------------------------------------------------------------------

export async function createMatchAction(input: {
  homeTeamId: number;
  awayTeamId: number;
  fieldId: number;
  cityId: number;
  matchDate: string;
}): Promise<LogisticsActionResult<Match>> {
  return runWithSession((token) =>
    createMatch(token, {
      homeTeamId: input.homeTeamId,
      awayTeamId: input.awayTeamId,
      fieldId: input.fieldId,
      cityId: input.cityId,
      matchDate: new Date(input.matchDate),
    }),
  );
}

/**
 * Gera jogos aleatórios: baralha todas as combinações possíveis das equipas escolhidas
 * e agenda `count` pares distintos no campo/cidade indicados.
 */
export async function generateRandomMatchesAction(input: {
  teamIds: number[];
  fieldId: number;
  cityId: number;
  count: number;
}): Promise<LogisticsActionResult<number>> {
  return runWithSession(async (token) => {
    const pairs: Array<[number, number]> = [];
    for (let i = 0; i < input.teamIds.length; i++) {
      for (let j = i + 1; j < input.teamIds.length; j++) {
        pairs.push([input.teamIds[i], input.teamIds[j]]);
      }
    }

    if (pairs.length === 0) {
      throw new Error("Selecione pelo menos duas equipas diferentes.");
    }

    // Fisher–Yates para escolher pares de forma aleatória.
    for (let i = pairs.length - 1; i > 0; i--) {
      const k = Math.floor(Math.random() * (i + 1));
      const current = pairs[i];
      const random = pairs[k];
      pairs[i] = random;
      pairs[k] = current;
    }

    const selected = pairs.slice(0, Math.max(1, Math.min(input.count, pairs.length)));
    const created = await Promise.all(
      selected.map(([homeTeamId, awayTeamId]) =>
        scheduleMatches(token, { teamIds: [homeTeamId, awayTeamId], fieldId: input.fieldId, cityId: input.cityId }),
      ),
    );

    return created.flat().length;
  });
}

export async function deleteMatchAction(id: number): Promise<LogisticsActionResult<void>> {
  return runWithSession((token) => deleteMatch(token, id));
}

// ---------------------------------------------------------------------------
// Ciclo de vida das partidas (start / finish / cancel / reschedule / score)
// ---------------------------------------------------------------------------

export async function startMatchAction(id: number): Promise<LogisticsActionResult<Match>> {
  return runWithSession((token) => startMatch(token, id));
}

export async function finishMatchAction(id: number): Promise<LogisticsActionResult<Match>> {
  return runWithSession((token) => finishMatch(token, id));
}

export async function cancelMatchAction(id: number): Promise<LogisticsActionResult<Match>> {
  return runWithSession((token) => cancelMatch(token, id));
}

export async function rescheduleMatchAction(
  id: number,
  matchDate: string,
): Promise<LogisticsActionResult<Match>> {
  return runWithSession((token) => rescheduleMatch(token, id, new Date(matchDate)));
}

export async function updateMatchScoreAction(
  id: number,
  homeScore: number,
  awayScore: number,
): Promise<LogisticsActionResult<Match>> {
  return runWithSession((token) => updateMatchScore(token, id, homeScore, awayScore));
}

// ---------------------------------------------------------------------------
// Matchmaking (procurar, listar, aceitar e rejeitar adversários)
// ---------------------------------------------------------------------------

export async function findMatchmakingAction(teamId: number): Promise<LogisticsActionResult<MatchmakingRecommendation[]>> {
  return runWithSession((token) => findMatch(token, teamId));
}

export async function getMatchmakingRecommendationsAction(
  teamId: number,
): Promise<LogisticsActionResult<MatchmakingRecommendationRow[]>> {
  return runWithSession((token) => getMatchmakingRecommendations(token, teamId));
}

export async function acceptMatchmakingAction(id: number): Promise<LogisticsActionResult<MatchmakingMatch>> {
  return runWithSession((token) => acceptMatchmaking(token, id));
}

export async function rejectMatchmakingAction(id: number): Promise<LogisticsActionResult<MatchmakingMatch>> {
  return runWithSession((token) => rejectMatchmaking(token, id));
}

// ---------------------------------------------------------------------------
// Realtime (Socket.IO) — o JWT só vive em cookies httpOnly, por isso é o
// servidor a devolver a credencial usada no handshake do socket.
// ---------------------------------------------------------------------------

export async function getRealtimeCredentialsAction(): Promise<LogisticsActionResult<{ accessToken: string }>> {
  try {
    const { accessToken } = await getSessionTokens();
    if (!accessToken) {
      return { ok: false, error: "Sessão expirada." };
    }
    return { ok: true, data: { accessToken } };
  } catch {
    return { ok: false, error: "Sessão expirada." };
  }
}
