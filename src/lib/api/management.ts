import { apiFetch, extractData } from "./client";
import type {
  City,
  CityInput,
  Field,
  FieldInput,
  FieldUpdateInput,
  Player,
  PlayerCreateInput,
  PlayerRating,
  PlayerUpdateInput,
  Team,
  TeamInput,
  TeamUpdateInput,
  Tournament,
  TournamentCreateInput,
  TournamentRegistration,
  TournamentRules,
  TournamentStanding,
  TournamentStatusTransition,
  TournamentUpdateInput,
} from "./types";

/**
 * Fetchers de gestão (CRUD) da peladeiro-api: cidades, campos, equipas,
 * jogadores, campeonatos, inscrições e classificações.
 *
 * As listas de cidades/campos/equipas continuam em `resources.ts`
 * (`getCities`/`getFields`/`getTeams`); aqui ficam as mutações e os
 * endpoints que os ecrãs de gestão acrescentam.
 */

/** Aceita respostas vindas como array ou como `{ data: [...] }` — a API mistura os dois formatos. */
function toArray<T>(payload: unknown): T[] {
  const data = extractData<T[] | T>(payload);
  if (Array.isArray(data)) return data;
  if (data) return [data];
  return [];
}

async function list<T>(path: string, token: string): Promise<T[]> {
  const payload = await apiFetch<unknown>(path, { token });
  return toArray<T>(payload);
}

/** GET /players devolve `{ core, rating, stats... }` — achata para o tipo `Player` da UI. */
interface RawPlayer {
  core: {
    id: string;
    fullName: string;
    nickname: string | null;
    birthDate: string | null;
    position: string | null;
    jerseyNumber: number | null;
    teamId: number | null;
    cityId: number | null;
    avatar: string | null;
  };
  rating: PlayerRating;
  matchesPlayed: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  cleanSheets: number;
  mvpAwards: number;
  minutesPlayed: number;
  isCaptain: boolean;
  isActive: boolean;
}

function flattenPlayer(raw: RawPlayer): Player {
  return {
    ...raw.core,
    rating: raw.rating,
    matchesPlayed: raw.matchesPlayed,
    goals: raw.goals,
    assists: raw.assists,
    yellowCards: raw.yellowCards,
    redCards: raw.redCards,
    cleanSheets: raw.cleanSheets,
    mvpAwards: raw.mvpAwards,
    minutesPlayed: raw.minutesPlayed,
    isCaptain: raw.isCaptain,
    isActive: raw.isActive,
  };
}

async function fetchPlayers(path: string, token: string): Promise<Player[]> {
  const payload = await apiFetch<unknown>(path, { token });
  const data = extractData<RawPlayer[] | RawPlayer>(payload);
  let rows: RawPlayer[];
  if (Array.isArray(data)) rows = data;
  else if (data) rows = [data];
  else rows = [];
  return rows.map(flattenPlayer);
}

// --- Cidades -----------------------------------------------------------------

/** Linha cru de GET/POST/PUT /cities — a API serializa a entidade com chaves pt (`nome`, `internalId`). */
export interface ApiCityRow {
  id?: string;
  internalId?: number | null;
  nome?: string;
}

/**
 * Normaliza uma cidade da API: `nome` → `name` e o índice numérico
 * (`internalId`) → `id`, pois campos/equipas/paritdas referenciam as cidades
 * pelo número e os endpoints PUT/DELETE /cities/:id também o aceitam.
 */
export function normalizeCity(row: ApiCityRow): City {
  return {
    id: row.internalId ?? 0,
    name: row.nome ?? "",
    isActive: true,
  };
}

export function createCity(token: string, input: CityInput): Promise<City> {
  return apiFetch<unknown>("/cities", { method: "POST", body: input, token }).then(extractData<ApiCityRow>).then(normalizeCity);
}

export function updateCity(token: string, cityId: number, input: CityInput): Promise<City> {
  return apiFetch<unknown>(`/cities/${cityId}`, { method: "PUT", body: input, token }).then(extractData<ApiCityRow>).then(normalizeCity);
}

export async function deleteCity(token: string, cityId: number): Promise<void> {
  await apiFetch<void>(`/cities/${cityId}`, { method: "DELETE", token });
}

// --- Campos ------------------------------------------------------------------

export function createField(token: string, input: FieldInput): Promise<Field> {
  return apiFetch<Field>("/fields", { method: "POST", body: input, token }).then(extractData<Field>);
}

export function updateField(token: string, fieldId: number, input: FieldUpdateInput): Promise<Field> {
  return apiFetch<Field>(`/fields/${fieldId}`, { method: "PUT", body: input, token }).then(extractData<Field>);
}

export async function deleteField(token: string, fieldId: number): Promise<void> {
  await apiFetch<void>(`/fields/${fieldId}`, { method: "DELETE", token });
}

// --- Equipas -----------------------------------------------------------------

export function createTeam(token: string, input: TeamInput): Promise<Team> {
  return apiFetch<Team>("/teams", { method: "POST", body: input, token }).then(extractData<Team>);
}

export function updateTeam(token: string, teamId: number, input: TeamUpdateInput): Promise<Team> {
  return apiFetch<Team>(`/teams/${teamId}`, { method: "PUT", body: input, token }).then(extractData<Team>);
}

export async function deleteTeam(token: string, teamId: number): Promise<void> {
  await apiFetch<void>(`/teams/${teamId}`, { method: "DELETE", token });
}

/** GET /teams/:id — devolve a equipa mesmo quando `isActive: false` (a listagem omite as inactivas). */
export function getTeam(token: string, teamId: number): Promise<Team> {
  return apiFetch<Team>(`/teams/${teamId}`, { token }).then(extractData<Team>);
}

/** Faixa sondada além do maior id ativo (margem para equipas inactivas criadas depois das activas). */
const INACTIVE_PROBE_MARGIN = 10;
/** Tamanho mínimo da faixa sondada quando ainda não existem equipas activas. */
const INACTIVE_PROBE_MIN = 30;

/**
 * Todas as equipas, incluindo as inactivas.
 *
 * `GET /teams` filtra `isActive: true` e a API não expõe listagem de inactivas,
 * mas `GET /teams/:id` devolve-as — por isso sonda os ids omissos da faixa ativa
 * (os 404 são ignorados). Quando a API passar a listar tudo, substituir por `getTeams`.
 */
export async function getAllTeams(token: string): Promise<Team[]> {
  // `list("/teams")` em vez de `getTeams` (resources.ts) para não criar import circular:
  // resources.ts já importa normalizeCity deste ficheiro.
  const active = await list<Team>("/teams", token);
  const maxId = active.reduce((max, team) => Math.max(max, team.id), 0);
  const upperBound = Math.max(maxId + INACTIVE_PROBE_MARGIN, INACTIVE_PROBE_MIN);
  const activeIds = new Set(active.map((team) => team.id));

  const missingIds: number[] = [];
  for (let id = 1; id <= upperBound; id += 1) {
    if (!activeIds.has(id)) missingIds.push(id);
  }

  const probed = await Promise.all(missingIds.map((id) => getTeam(token, id).catch(() => null)));
  const inactive = probed.filter((team): team is Team => team !== null && team.isActive === false);

  return [...active, ...inactive.sort((a, b) => a.id - b.id)];
}

// --- Jogadores ---------------------------------------------------------------

export function listPlayers(token: string): Promise<Player[]> {
  return fetchPlayers("/players", token);
}

export function getTeamPlayers(token: string, teamId: number): Promise<Player[]> {
  return fetchPlayers(`/players/team/${teamId}`, token);
}

export async function createPlayer(token: string, input: PlayerCreateInput): Promise<string> {
  const payload = await apiFetch<unknown>("/players", { method: "POST", body: input, token });
  return extractData<{ id: string }>(payload).id;
}

export async function updatePlayer(token: string, playerId: string, input: PlayerUpdateInput): Promise<void> {
  await apiFetch(`/players/${playerId}`, { method: "PUT", body: input, token });
}

export async function deletePlayer(token: string, playerId: string): Promise<void> {
  await apiFetch<void>(`/players/${playerId}`, { method: "DELETE", token });
}

export async function promoteCaptain(token: string, playerId: string): Promise<void> {
  await apiFetch(`/players/${playerId}/promote-captain`, { method: "POST", token });
}

export async function removeCaptain(token: string, playerId: string): Promise<void> {
  await apiFetch(`/players/${playerId}/remove-captain`, { method: "POST", token });
}

// --- Campeonatos -------------------------------------------------------------

export function getTournaments(token: string): Promise<Tournament[]> {
  return list<Tournament>("/tournaments", token);
}

export function createTournament(token: string, input: TournamentCreateInput): Promise<Tournament> {
  return apiFetch<Tournament>("/tournaments", { method: "POST", body: input, token }).then(extractData<Tournament>);
}

export function updateTournament(
  token: string,
  tournamentId: number,
  input: TournamentUpdateInput,
): Promise<Tournament> {
  return apiFetch<Tournament>(`/tournaments/${tournamentId}`, { method: "PUT", body: input, token }).then(
    extractData<Tournament>,
  );
}

export function changeTournamentStatus(
  token: string,
  tournamentId: number,
  status: TournamentStatusTransition,
): Promise<Tournament> {
  return apiFetch<Tournament>(`/tournaments/${tournamentId}/status`, {
    method: "PATCH",
    body: { status },
    token,
  }).then(extractData<Tournament>);
}

export async function deleteTournament(token: string, tournamentId: number): Promise<void> {
  await apiFetch<void>(`/tournaments/${tournamentId}`, { method: "DELETE", token });
}

// --- Inscrições de campeonato ------------------------------------------------

export function getTournamentRegistrations(
  token: string,
  tournamentId: number,
): Promise<TournamentRegistration[]> {
  return list<TournamentRegistration>(`/tournament-registrations/tournament/${tournamentId}`, token);
}

export function registerTeam(
  token: string,
  input: { tournamentId: number; teamId: number },
): Promise<TournamentRegistration> {
  return apiFetch<TournamentRegistration>("/tournament-registrations/register", {
    method: "POST",
    body: input,
    token,
  }).then(extractData<TournamentRegistration>);
}

export async function approveRegistration(token: string, registrationId: number): Promise<void> {
  await apiFetch(`/tournament-registrations/${registrationId}/approve`, { method: "POST", token });
}

export async function rejectRegistration(token: string, registrationId: number, reason?: string): Promise<void> {
  await apiFetch(`/tournament-registrations/${registrationId}/reject`, {
    method: "POST",
    body: { reason },
    token,
  });
}

export async function removeRegistration(token: string, registrationId: number): Promise<void> {
  await apiFetch(`/tournament-registrations/${registrationId}/remove`, { method: "POST", token });
}

// --- Classificação -----------------------------------------------------------

export function getStandings(token: string, tournamentId: number): Promise<TournamentStanding[]> {
  return list<TournamentStanding>(`/tournament-standings/${tournamentId}`, token);
}

export async function calculateStandings(token: string, tournamentId: number): Promise<TournamentStanding[]> {
  const payload = await apiFetch<unknown>(`/tournament-standings/${tournamentId}/calculate`, {
    method: "POST",
    token,
  });
  return toArray<TournamentStanding>(payload);
}

export async function resetStandings(token: string, tournamentId: number): Promise<void> {
  await apiFetch<void>(`/tournament-standings/${tournamentId}/reset`, { method: "POST", token });
}
