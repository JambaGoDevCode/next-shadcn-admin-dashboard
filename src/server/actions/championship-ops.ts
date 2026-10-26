"use server";

import { ApiError } from "@/lib/api/client";
import {
  advanceStage,
  applyPenalty,
  assignAward,
  calculateAwards,
  confirmPayment,
  createPayment,
  createStage,
  deleteAward,
  deleteDiscipline,
  deleteFixture,
  deleteStage,
  generateFixtures,
  getChampionHistories,
  getDisciplineReport,
  getPaymentStatus,
  getPlayerTournamentStats,
  getTeamTournamentStats,
  getTournamentHistory,
  getTopAssists,
  getTopScorers,
  liftSuspension,
  listAwards,
  listFixtures,
  listPaymentsByTeam,
  listPaymentsByTournament,
  listStages,
  recordTournamentHistory,
  refundPayment,
  regenerateFixtures,
  registerCard,
  suspendPlayer,
  updateAward,
  updateFixtureResult,
  updateStage,
} from "@/lib/api/tournament-ops";
import type {
  ApplyPenaltyInput,
  AwardUpdateInput,
  CreatePaymentInput,
  FixtureResultInput,
  GenerateFixturesInput,
  LiftSuspensionInput,
  RegisterCardInput,
  StageCreateInput,
  StageUpdateInput,
  SuspendPlayerInput,
  TournamentAward,
  TournamentDiscipline,
  TournamentFixture,
  TournamentHistory,
  TournamentPayment,
  TournamentPlayerStats,
  TournamentStage,
  TournamentTeamStats,
  TournamentTopAssist,
  TournamentTopScorer,
} from "@/lib/api/types";
import { getSessionTokens } from "@/lib/auth/session";

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

/** Mensagens da API traduzidas para PT (chave exata ou início da mensagem). */
const OPS_MESSAGES: ReadonlyArray<{ match: string; message: string }> = [
  { match: "Cannot delete an active stage", message: "Não é possível eliminar uma fase ativa. Conclua ou substitua a fase primeiro." },
  { match: "A stage with this order already exists", message: "Já existe uma fase com esta ordem neste campeonato." },
  { match: "New name is required", message: "O nome da fase é obrigatório." },
  { match: "Matches per team must be greater than zero", message: "Os jogos por equipa têm de ser maiores que zero." },
  { match: "Qualified teams must be greater than zero", message: "As equipas qualificadas têm de ser maiores que zero." },
  { match: "Both home and away scores are required", message: "Indique o resultado das duas equipas (casa e fora)." },
  { match: "Scores cannot be negative", message: "Os resultados não podem ser negativos." },
  { match: "Fixture already played", message: "Este jogo já tem resultado registado." },
  { match: "Tournament already contains fixtures", message: "O campeonato já tem jogos gerados. Use \"Regenerar jogos\" para os substituir." },
  { match: "Player ID or Team ID is required", message: "Selecione um jogador ou uma equipa." },
  { match: "Registration already has a payment", message: "A inscrição já tem um pagamento registado." },
  { match: "Finance payment is not confirmed", message: "O pagamento financeiro ainda não foi confirmado pelo sistema de pagamentos." },
  { match: "Only paid payments can be refunded", message: "Só pagamentos liquidados podem ser reembolsados." },
  { match: "History already exists for tournament", message: "O histórico deste campeonato já foi registado." },
  { match: "Cannot create suspension without playerId", message: "A suspensão tem de indicar o jogador." },
];

async function requireToken(): Promise<string> {
  const { accessToken } = await getSessionTokens();
  if (!accessToken) throw new Error("unauthorized");
  return accessToken;
}

function toErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 429) return "Limite de pedidos excedido. Aguarde alguns minutos e tente novamente.";
    const translated = OPS_MESSAGES.find(
      (entry) => error.message === entry.match || error.message.startsWith(entry.match),
    );
    if (translated) return translated.message;
    return error.message;
  }
  if (error instanceof Error && error.message === "unauthorized") {
    return "Sessão expirada. Faça login novamente.";
  }
  return "Não foi possível conectar à peladeiro-api.";
}

// --- Fases --------------------------------------------------------------------

export async function listStagesAction(tournamentId: number): Promise<ActionResult<TournamentStage[]>> {
  try {
    const token = await requireToken();
    return { ok: true, data: await listStages(token, tournamentId) };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function createStageAction(input: StageCreateInput): Promise<ActionResult<TournamentStage>> {
  try {
    const token = await requireToken();
    return { ok: true, data: await createStage(token, input) };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function updateStageAction(
  stageId: number,
  input: StageUpdateInput,
): Promise<ActionResult<TournamentStage>> {
  try {
    const token = await requireToken();
    return { ok: true, data: await updateStage(token, stageId, input) };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function advanceStageAction(stageId: number): Promise<ActionResult<TournamentStage>> {
  try {
    const token = await requireToken();
    return { ok: true, data: await advanceStage(token, stageId) };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function deleteStageAction(stageId: number): Promise<ActionResult<void>> {
  try {
    const token = await requireToken();
    await deleteStage(token, stageId);
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

// --- Jogos --------------------------------------------------------------------

export async function listFixturesAction(tournamentId: number): Promise<ActionResult<TournamentFixture[]>> {
  try {
    const token = await requireToken();
    return { ok: true, data: await listFixtures(token, tournamentId) };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function generateFixturesAction(input: GenerateFixturesInput): Promise<ActionResult<TournamentFixture[]>> {
  try {
    const token = await requireToken();
    return { ok: true, data: await generateFixtures(token, input) };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function regenerateFixturesAction(
  input: GenerateFixturesInput,
): Promise<ActionResult<TournamentFixture[]>> {
  try {
    const token = await requireToken();
    return { ok: true, data: await regenerateFixtures(token, input) };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function updateFixtureResultAction(
  fixtureId: number,
  input: FixtureResultInput,
): Promise<ActionResult<TournamentFixture>> {
  try {
    const token = await requireToken();
    return { ok: true, data: await updateFixtureResult(token, fixtureId, input) };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function deleteFixtureAction(fixtureId: number): Promise<ActionResult<void>> {
  try {
    const token = await requireToken();
    await deleteFixture(token, fixtureId);
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

// --- Prémios ------------------------------------------------------------------

export async function listAwardsAction(tournamentId: number): Promise<ActionResult<TournamentAward[]>> {
  try {
    const token = await requireToken();
    return { ok: true, data: await listAwards(token, tournamentId) };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function calculateAwardsAction(tournamentId: number): Promise<ActionResult<TournamentAward[]>> {
  try {
    const token = await requireToken();
    return { ok: true, data: await calculateAwards(token, tournamentId) };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function assignAwardAction(awardId: number): Promise<ActionResult<TournamentAward>> {
  try {
    const token = await requireToken();
    return { ok: true, data: await assignAward(token, awardId) };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function updateAwardAction(
  awardId: number,
  input: AwardUpdateInput,
): Promise<ActionResult<TournamentAward>> {
  try {
    const token = await requireToken();
    return { ok: true, data: await updateAward(token, awardId, input) };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function deleteAwardAction(awardId: number): Promise<ActionResult<void>> {
  try {
    const token = await requireToken();
    await deleteAward(token, awardId);
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

// --- Disciplinas --------------------------------------------------------------

export async function listDisciplineReportAction(
  tournamentId: number,
  filters: { playerId?: string; teamId?: number; matchId?: number; activeOnly?: boolean } = {},
): Promise<ActionResult<TournamentDiscipline[]>> {
  try {
    const token = await requireToken();
    return { ok: true, data: await getDisciplineReport(token, tournamentId, filters) };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function registerCardAction(input: RegisterCardInput): Promise<ActionResult<TournamentDiscipline>> {
  try {
    const token = await requireToken();
    return { ok: true, data: await registerCard(token, input) };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function suspendPlayerAction(input: SuspendPlayerInput): Promise<ActionResult<TournamentDiscipline>> {
  try {
    const token = await requireToken();
    return { ok: true, data: await suspendPlayer(token, input) };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function liftSuspensionAction(input: LiftSuspensionInput): Promise<ActionResult<TournamentDiscipline>> {
  try {
    const token = await requireToken();
    return { ok: true, data: await liftSuspension(token, input) };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function applyPenaltyAction(input: ApplyPenaltyInput): Promise<ActionResult<TournamentDiscipline>> {
  try {
    const token = await requireToken();
    return { ok: true, data: await applyPenalty(token, input) };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function deleteDisciplineAction(disciplineId: number): Promise<ActionResult<void>> {
  try {
    const token = await requireToken();
    await deleteDiscipline(token, disciplineId);
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

// --- Pagamentos ---------------------------------------------------------------

export async function listPaymentsByTournamentAction(
  tournamentId: number,
): Promise<ActionResult<TournamentPayment[]>> {
  try {
    const token = await requireToken();
    return { ok: true, data: await listPaymentsByTournament(token, tournamentId) };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function listPaymentsByTeamAction(teamId: number): Promise<ActionResult<TournamentPayment[]>> {
  try {
    const token = await requireToken();
    return { ok: true, data: await listPaymentsByTeam(token, teamId) };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function getPaymentStatusAction(paymentId: number): Promise<ActionResult<TournamentPayment>> {
  try {
    const token = await requireToken();
    return { ok: true, data: await getPaymentStatus(token, paymentId) };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function createPaymentAction(input: CreatePaymentInput): Promise<ActionResult<TournamentPayment>> {
  try {
    const token = await requireToken();
    return { ok: true, data: await createPayment(token, input) };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function confirmPaymentAction(paymentId: number): Promise<ActionResult<void>> {
  try {
    const token = await requireToken();
    await confirmPayment(token, paymentId);
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function refundPaymentAction(paymentId: number): Promise<ActionResult<void>> {
  try {
    const token = await requireToken();
    await refundPayment(token, paymentId);
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

// --- Históricos ---------------------------------------------------------------

export async function recordHistoryAction(tournamentId: number): Promise<ActionResult<TournamentHistory | null>> {
  try {
    const token = await requireToken();
    return { ok: true, data: await recordTournamentHistory(token, tournamentId) };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function getTournamentHistoryAction(
  tournamentId: number,
): Promise<ActionResult<TournamentHistory | null>> {
  try {
    const token = await requireToken();
    return { ok: true, data: await getTournamentHistory(token, tournamentId) };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function getChampionHistoriesAction(): Promise<ActionResult<TournamentHistory[]>> {
  try {
    const token = await requireToken();
    return { ok: true, data: await getChampionHistories(token) };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

// --- Estatísticas -------------------------------------------------------------

export async function getTopScorersAction(tournamentId: number): Promise<ActionResult<TournamentTopScorer[]>> {
  try {
    const token = await requireToken();
    return { ok: true, data: await getTopScorers(token, tournamentId) };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function getTopAssistsAction(tournamentId: number): Promise<ActionResult<TournamentTopAssist[]>> {
  try {
    const token = await requireToken();
    return { ok: true, data: await getTopAssists(token, tournamentId) };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function getTeamStatsAction(
  tournamentId: number,
  teamId: number,
): Promise<ActionResult<TournamentTeamStats | null>> {
  try {
    const token = await requireToken();
    return { ok: true, data: await getTeamTournamentStats(token, tournamentId, teamId) };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function getPlayerStatsAction(
  tournamentId: number,
  playerId: string,
): Promise<ActionResult<TournamentPlayerStats | null>> {
  try {
    const token = await requireToken();
    return { ok: true, data: await getPlayerTournamentStats(token, tournamentId, playerId) };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}
