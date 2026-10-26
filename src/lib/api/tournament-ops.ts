import { apiFetch, extractData } from "./client";
import type {
  ApplyPenaltyInput,
  AwardUpdateInput,
  CreatePaymentInput,
  FixtureResultInput,
  GenerateFixturesInput,
  LiftSuspensionInput,
  RegisterCardInput,
  StageCreateInput,
  StageRule,
  StageUpdateInput,
  SuspendPlayerInput,
  TournamentAward,
  TournamentDiscipline,
  TournamentFixture,
  TournamentHistory,
  TournamentHistoryEntry,
  TournamentPayment,
  TournamentPlayerStats,
  TournamentStage,
  TournamentTeamStats,
  TournamentTopAssist,
  TournamentTopScorer,
} from "./types";

/**
 * Fetchers dos sub-módulos de campeonatos: fases, jogos, prémios,
 * disciplinas, pagamentos, históricos e estatísticas.
 *
 * A API mistura três formatos — arrays soltos, `{ data: ... }`, objetos com
 * chaves agrupadas (`{ stages: [...] }`, `{ payments: [...] }`) e entidades de
 * domínio serializadas com prefixes `_` (respostas de PUT de fases e de
 * históricos). Toda a normalização acontece aqui, para que os ecrãs recebam
 * sempre os tipos limpos de `types.ts`.
 */

/** Aceita arrays soltos ou `{ data: [...] }` — a API mistura os dois. */
function toArray<T>(payload: unknown): T[] {
  const data = extractData<T[] | T>(payload);
  if (Array.isArray(data)) return data;
  if (data) return [data];
  return [];
}

/** Extrai um array a partir de uma chave agrupada (`{ stages: [...] }`, `{ payments: [...] }`). */
function pickArray<T>(payload: unknown, key: string): T[] {
  const data = extractData<Record<string, unknown> | null>(payload);
  if (!data || Array.isArray(data)) return toArray<T>(payload);
  const rows = data[key];
  return Array.isArray(rows) ? (rows as T[]) : [];
}

// --- Normalização de entidades com prefixes `_` --------------------------------

interface RawStage {
  stageId?: number;
  _id?: number;
  tournamentId?: number;
  _tournamentId?: number;
  name?: string;
  _name?: string;
  type?: string;
  _type?: string;
  order?: number;
  _order?: number;
  status?: string;
  _status?: string;
  rule?: unknown;
  _rule?: unknown;
  startedAt?: string | null;
  _startedAt?: string | null;
  completedAt?: string | null;
  _completedAt?: string | null;
}

/** O `rule` chega como `{ props: {...} }` (value object) ou como objeto plano. */
function pickRule(value: unknown): StageRule | undefined {
  if (!value || typeof value !== "object") return undefined;
  const vo = value as { props?: StageRule } & Partial<StageRule>;
  if (vo.props) return vo.props;
  if (typeof vo.matchesPerTeam === "number") return value as StageRule;
  return undefined;
}

/** Converte a resposta (limpa ou com `_`) no tipo `TournamentStage`. */
export function normalizeStage(raw: unknown): TournamentStage {
  const s = (raw ?? {}) as RawStage;
  return {
    stageId: s.stageId ?? s._id ?? 0,
    tournamentId: s.tournamentId ?? s._tournamentId ?? 0,
    name: s.name ?? s._name ?? "",
    type: s.type ?? s._type ?? "",
    order: s.order ?? s._order ?? 0,
    status: s.status ?? s._status ?? "PENDING",
    rule: pickRule(s.rule ?? s._rule),
    startedAt: s.startedAt ?? s._startedAt ?? null,
    completedAt: s.completedAt ?? s._completedAt ?? null,
  };
}

interface RawHistory {
  _id?: number;
  _tournamentId?: number;
  _tournamentName?: string | null;
  _tournamentType?: string | null;
  _championTeamId?: number | null;
  _championTeamName?: string | null;
  _runnerUpTeamId?: number | null;
  _runnerUpTeamName?: string | null;
  _startedAt?: string | null;
  _finishedAt?: string | null;
  _createdAt?: string | null;
  _entries?: Array<{ props?: TournamentHistoryEntry } | TournamentHistoryEntry>;
}

/** Converte a entidade de histórico (sempre com `_`) no tipo `TournamentHistory`. */
export function normalizeHistory(raw: unknown): TournamentHistory | null {
  if (!raw || typeof raw !== "object") return null;
  const h = raw as RawHistory;
  const entries = (h._entries ?? []).map((entry) =>
    entry && "props" in entry && entry.props ? entry.props : (entry as TournamentHistoryEntry),
  );
  return {
    id: h._id ?? 0,
    tournamentId: h._tournamentId ?? 0,
    tournamentName: h._tournamentName ?? null,
    tournamentType: h._tournamentType ?? null,
    championTeamId: h._championTeamId ?? null,
    championTeamName: h._championTeamName ?? null,
    runnerUpTeamId: h._runnerUpTeamId ?? null,
    runnerUpTeamName: h._runnerUpTeamName ?? null,
    startedAt: h._startedAt ?? null,
    finishedAt: h._finishedAt ?? null,
    entries,
    createdAt: h._createdAt ?? undefined,
  };
}

// --- Fases --------------------------------------------------------------------

export async function listStages(token: string, tournamentId: number): Promise<TournamentStage[]> {
  const payload = await apiFetch<unknown>(`/tournament-stages/tournament/${tournamentId}`, { token });
  return pickArray<unknown>(payload, "stages").map(normalizeStage);
}

export async function getStageStatus(token: string, stageId: number): Promise<TournamentStage> {
  const payload = await apiFetch<unknown>(`/tournament-stages/${stageId}`, { token });
  return normalizeStage(extractData<unknown>(payload));
}

export async function createStage(token: string, input: StageCreateInput): Promise<TournamentStage> {
  const payload = await apiFetch<unknown>("/tournament-stages", { method: "POST", body: input, token });
  return normalizeStage(extractData<unknown>(payload));
}

export async function updateStage(token: string, stageId: number, input: StageUpdateInput): Promise<TournamentStage> {
  const payload = await apiFetch<unknown>(`/tournament-stages/${stageId}`, { method: "PUT", body: input, token });
  return normalizeStage(extractData<unknown>(payload));
}

export async function advanceStage(token: string, stageId: number): Promise<TournamentStage> {
  const payload = await apiFetch<unknown>(`/tournament-stages/${stageId}/advance`, { method: "POST", token });
  return normalizeStage(extractData<unknown>(payload));
}

export async function deleteStage(token: string, stageId: number): Promise<void> {
  await apiFetch<void>(`/tournament-stages/${stageId}`, { method: "DELETE", token });
}

// --- Jogos --------------------------------------------------------------------

export function listFixtures(token: string, tournamentId: number): Promise<TournamentFixture[]> {
  return apiFetch<TournamentFixture[]>(`/tournament-fixtures/tournament/${tournamentId}`, { token }).then((payload) =>
    extractData<TournamentFixture[]>(payload),
  );
}

export async function generateFixtures(token: string, input: GenerateFixturesInput): Promise<TournamentFixture[]> {
  const payload = await apiFetch<unknown>("/tournament-fixtures/generate", { method: "POST", body: input, token });
  return toArray<TournamentFixture>(payload);
}

export async function regenerateFixtures(token: string, input: GenerateFixturesInput): Promise<TournamentFixture[]> {
  const payload = await apiFetch<unknown>("/tournament-fixtures/regenerate", { method: "POST", body: input, token });
  return toArray<TournamentFixture>(payload);
}

export function updateFixtureResult(
  token: string,
  fixtureId: number,
  input: FixtureResultInput,
): Promise<TournamentFixture> {
  return apiFetch<TournamentFixture>(`/tournament-fixtures/${fixtureId}`, { method: "PUT", body: input, token }).then(
    (payload) => extractData<TournamentFixture>(payload),
  );
}

export async function deleteFixture(token: string, fixtureId: number): Promise<void> {
  await apiFetch<void>(`/tournament-fixtures/${fixtureId}`, { method: "DELETE", token });
}

// --- Prémios ------------------------------------------------------------------

export async function listAwards(token: string, tournamentId: number): Promise<TournamentAward[]> {
  const payload = await apiFetch<unknown>(`/tournament-awards/tournaments/${tournamentId}/awards`, { token });
  return pickArray<TournamentAward>(payload, "awards");
}

export async function calculateAwards(token: string, tournamentId: number): Promise<TournamentAward[]> {
  const payload = await apiFetch<unknown>(`/tournament-awards/tournaments/${tournamentId}/awards/calculate`, {
    method: "POST",
    token,
  });
  return pickArray<TournamentAward>(payload, "awards");
}

export function assignAward(token: string, awardId: number): Promise<TournamentAward> {
  return apiFetch<TournamentAward>(`/tournament-awards/awards/${awardId}/assign`, { method: "POST", token }).then(
    (payload) => extractData<TournamentAward>(payload),
  );
}

export function updateAward(token: string, awardId: number, input: AwardUpdateInput): Promise<TournamentAward> {
  return apiFetch<TournamentAward>(`/tournament-awards/awards/${awardId}`, { method: "PUT", body: input, token }).then(
    (payload) => extractData<TournamentAward>(payload),
  );
}

export async function deleteAward(token: string, awardId: number): Promise<void> {
  await apiFetch<void>(`/tournament-awards/awards/${awardId}`, { method: "DELETE", token });
}

// --- Disciplinas --------------------------------------------------------------

export interface DisciplineReportFilters {
  playerId?: string;
  teamId?: number;
  matchId?: number;
  activeOnly?: boolean;
}

export function getDisciplineReport(
  token: string,
  tournamentId: number,
  filters: DisciplineReportFilters = {},
): Promise<TournamentDiscipline[]> {
  const params = new URLSearchParams({ tournamentId: String(tournamentId) });
  if (filters.playerId) params.set("playerId", filters.playerId);
  if (filters.teamId !== undefined) params.set("teamId", String(filters.teamId));
  if (filters.matchId !== undefined) params.set("matchId", String(filters.matchId));
  if (filters.activeOnly) params.set("activeOnly", "true");
  return apiFetch<TournamentDiscipline[]>(`/tournament-discipline/report?${params.toString()}`, { token }).then(
    (payload) => extractData<TournamentDiscipline[]>(payload),
  );
}

export function registerCard(token: string, input: RegisterCardInput): Promise<TournamentDiscipline> {
  return apiFetch<TournamentDiscipline>("/tournament-discipline/cards", { method: "POST", body: input, token }).then(
    (payload) => extractData<TournamentDiscipline>(payload),
  );
}

export function suspendPlayer(token: string, input: SuspendPlayerInput): Promise<TournamentDiscipline> {
  return apiFetch<TournamentDiscipline>("/tournament-discipline/suspensions", {
    method: "POST",
    body: input,
    token,
  }).then((payload) => extractData<TournamentDiscipline>(payload));
}

export function liftSuspension(token: string, input: LiftSuspensionInput): Promise<TournamentDiscipline> {
  return apiFetch<TournamentDiscipline>("/tournament-discipline/suspensions/lift", {
    method: "PATCH",
    body: input,
    token,
  }).then((payload) => extractData<TournamentDiscipline>(payload));
}

export function applyPenalty(token: string, input: ApplyPenaltyInput): Promise<TournamentDiscipline> {
  return apiFetch<TournamentDiscipline>("/tournament-discipline/penalties", {
    method: "POST",
    body: input,
    token,
  }).then((payload) => extractData<TournamentDiscipline>(payload));
}

export async function deleteDiscipline(token: string, disciplineId: number): Promise<void> {
  await apiFetch<void>(`/tournament-discipline/disciplines/${disciplineId}`, { method: "DELETE", token });
}

// --- Pagamentos ---------------------------------------------------------------

export async function listPaymentsByTournament(token: string, tournamentId: number): Promise<TournamentPayment[]> {
  const payload = await apiFetch<unknown>(`/tournament-payments/tournament/${tournamentId}`, { token });
  return pickArray<TournamentPayment>(payload, "payments");
}

export async function listPaymentsByTeam(token: string, teamId: number): Promise<TournamentPayment[]> {
  const payload = await apiFetch<unknown>(`/tournament-payments/team/${teamId}`, { token });
  return pickArray<TournamentPayment>(payload, "payments");
}

/** Detalhe de pagamento — a resposta usa `tournamentPaymentId` como identificador. */
export async function getPaymentStatus(token: string, paymentId: number): Promise<TournamentPayment> {
  const payload = await apiFetch<unknown>(`/tournament-payments/${paymentId}/status`, { token });
  const raw = extractData<Record<string, unknown> | null>(payload);
  if (!raw || Array.isArray(raw)) return { id: paymentId, teamId: 0, status: "PENDING" };
  const returnedId = raw.tournamentPaymentId;
  return {
    ...(raw as unknown as TournamentPayment),
    id: typeof returnedId === "number" ? returnedId : paymentId,
  };
}

export function createPayment(token: string, input: CreatePaymentInput): Promise<TournamentPayment> {
  return apiFetch<TournamentPayment>("/tournament-payments/", { method: "POST", body: input, token }).then((payload) =>
    extractData<TournamentPayment>(payload),
  );
}

export async function confirmPayment(token: string, paymentId: number): Promise<void> {
  await apiFetch(`/tournament-payments/${paymentId}/confirm`, { method: "POST", token });
}

export async function refundPayment(token: string, paymentId: number): Promise<void> {
  await apiFetch(`/tournament-payments/${paymentId}/refund`, { method: "POST", token });
}

// --- Históricos ---------------------------------------------------------------

/** Regista o snapshot do campeonato — devolve 409 quando o histórico já existe. */
export async function recordTournamentHistory(token: string, tournamentId: number): Promise<TournamentHistory | null> {
  const payload = await apiFetch<unknown>(`/tournament-history/tournaments/${tournamentId}/history`, {
    method: "POST",
    token,
  });
  return normalizeHistory(extractData<unknown>(payload));
}

export async function getTournamentHistory(token: string, tournamentId: number): Promise<TournamentHistory | null> {
  const payload = await apiFetch<unknown>(`/tournament-history/tournaments/${tournamentId}/history`, { token });
  return normalizeHistory(extractData<unknown>(payload));
}

export async function getTeamHistory(token: string, teamId: number): Promise<TournamentHistory[]> {
  const payload = await apiFetch<unknown>(`/tournament-history/teams/${teamId}/history`, { token });
  return toArray<unknown>(payload)
    .map(normalizeHistory)
    .filter((h): h is TournamentHistory => h !== null);
}

export async function getChampionHistories(token: string): Promise<TournamentHistory[]> {
  const payload = await apiFetch<unknown>("/tournament-history/history/champions", { token });
  return toArray<unknown>(payload)
    .map(normalizeHistory)
    .filter((h): h is TournamentHistory => h !== null);
}

// --- Estatísticas -------------------------------------------------------------

export function getTopScorers(token: string, tournamentId: number): Promise<TournamentTopScorer[]> {
  return apiFetch<TournamentTopScorer[]>(`/tournament-statistics/${tournamentId}/top-scorers`, { token }).then(
    (payload) => extractData<TournamentTopScorer[]>(payload),
  );
}

export function getTopAssists(token: string, tournamentId: number): Promise<TournamentTopAssist[]> {
  return apiFetch<TournamentTopAssist[]>(`/tournament-statistics/${tournamentId}/top-assists`, { token }).then(
    (payload) => extractData<TournamentTopAssist[]>(payload),
  );
}

/** Estatísticas da equipa — `null` quando a equipa ainda não tem jogos. */
export async function getTeamTournamentStats(
  token: string,
  tournamentId: number,
  teamId: number,
): Promise<TournamentTeamStats | null> {
  const payload = await apiFetch<unknown>(`/tournament-statistics/${tournamentId}/team/${teamId}`, { token });
  const data = extractData<TournamentTeamStats | null>(payload);
  return data ?? null;
}

/** Estatísticas do jogador — `null` quando o jogador ainda não tem jogos. */
export async function getPlayerTournamentStats(
  token: string,
  tournamentId: number,
  playerId: string,
): Promise<TournamentPlayerStats | null> {
  const payload = await apiFetch<unknown>(`/tournament-statistics/${tournamentId}/player/${playerId}`, { token });
  const data = extractData<TournamentPlayerStats | null>(payload);
  return data ?? null;
}
