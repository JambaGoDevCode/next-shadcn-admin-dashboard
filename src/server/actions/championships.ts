"use server";

import { ApiError } from "@/lib/api/client";
import {
  approveRegistration,
  calculateStandings,
  changeTournamentStatus,
  createTournament,
  deleteTournament,
  getStandings,
  getTournamentRegistrations,
  getTournaments,
  registerTeam,
  rejectRegistration,
  removeRegistration,
  resetStandings,
  updateTournament,
} from "@/lib/api/management";
import type {
  Tournament,
  TournamentCreateInput,
  TournamentRegistration,
  TournamentStanding,
  TournamentStatusTransition,
  TournamentUpdateInput,
} from "@/lib/api/types";
import { getSessionTokens } from "@/lib/auth/session";

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

/** Mensagens de domínio da API traduzidas para PT (erros de transição de estado). */
const TOURNAMENT_MESSAGES: Record<string, string> = {
  "Cannot update tournament in progress": "Não é possível editar um campeonato em curso.",
  "Finished tournaments cannot be cancelled": "Campeonatos concluídos não podem ser cancelados.",
  "Team already registered in this tournament": "Esta equipa já está inscrita neste campeonato.",
  "Tournament is not in progress": "O campeonato não está em curso.",
  "Tournament registration must be closed before starting": "Feche as inscrições antes de iniciar o campeonato.",
  "Unsupported status transition": "Transição de estado não suportada.",
};

async function requireToken(): Promise<string> {
  const { accessToken } = await getSessionTokens();
  if (!accessToken) throw new Error("unauthorized");
  return accessToken;
}

function toErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 429) return "Limite de pedidos excedido. Aguarde alguns minutos e tente novamente.";
    const translated = TOURNAMENT_MESSAGES[error.message];
    if (translated) return translated;
    if (error.code === "FOREIGN_KEY_VIOLATION") {
      return "O campeonato tem inscrições, classificações ou jogos associados e não pode ser eliminado. Cancele-o em vez de o eliminar.";
    }
    return error.message;
  }
  if (error instanceof Error && error.message === "unauthorized") {
    return "Sessão expirada. Faça login novamente.";
  }
  return "Não foi possível conectar à peladeiro-api.";
}

// --- Campeonatos -------------------------------------------------------------

/** Lista os campeonatos (GET /tournaments, ordenados do mais recente). */
export async function listTournamentsAction(): Promise<ActionResult<Tournament[]>> {
  try {
    const token = await requireToken();
    return { ok: true, data: await getTournaments(token) };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function createTournamentAction(input: TournamentCreateInput): Promise<ActionResult<Tournament>> {
  try {
    const token = await requireToken();
    return { ok: true, data: await createTournament(token, input) };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function updateTournamentAction(
  tournamentId: number,
  input: TournamentUpdateInput,
): Promise<ActionResult<Tournament>> {
  try {
    const token = await requireToken();
    return { ok: true, data: await updateTournament(token, tournamentId, input) };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

/** Transição de estado (PATCH /tournaments/:id/status): inscrições → início → conclusão/cancelamento. */
export async function changeTournamentStatusAction(
  tournamentId: number,
  status: TournamentStatusTransition,
): Promise<ActionResult<Tournament>> {
  try {
    const token = await requireToken();
    return { ok: true, data: await changeTournamentStatus(token, tournamentId, status) };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function deleteTournamentAction(tournamentId: number): Promise<ActionResult<void>> {
  try {
    const token = await requireToken();
    await deleteTournament(token, tournamentId);
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

// --- Inscrições --------------------------------------------------------------

export async function listRegistrationsAction(
  tournamentId: number,
): Promise<ActionResult<TournamentRegistration[]>> {
  try {
    const token = await requireToken();
    return { ok: true, data: await getTournamentRegistrations(token, tournamentId) };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function registerTeamAction(input: {
  tournamentId: number;
  teamId: number;
}): Promise<ActionResult<TournamentRegistration>> {
  try {
    const token = await requireToken();
    return { ok: true, data: await registerTeam(token, input) };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function approveRegistrationAction(registrationId: number): Promise<ActionResult<void>> {
  try {
    const token = await requireToken();
    await approveRegistration(token, registrationId);
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function rejectRegistrationAction(registrationId: number, reason?: string): Promise<ActionResult<void>> {
  try {
    const token = await requireToken();
    await rejectRegistration(token, registrationId, reason);
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function removeRegistrationAction(registrationId: number): Promise<ActionResult<void>> {
  try {
    const token = await requireToken();
    await removeRegistration(token, registrationId);
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

// --- Classificação ------------------------------------------------------------

export async function listStandingsAction(tournamentId: number): Promise<ActionResult<TournamentStanding[]>> {
  try {
    const token = await requireToken();
    return { ok: true, data: await getStandings(token, tournamentId) };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function calculateStandingsAction(
  tournamentId: number,
): Promise<ActionResult<TournamentStanding[]>> {
  try {
    const token = await requireToken();
    return { ok: true, data: await calculateStandings(token, tournamentId) };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function resetStandingsAction(tournamentId: number): Promise<ActionResult<void>> {
  try {
    const token = await requireToken();
    await resetStandings(token, tournamentId);
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}
