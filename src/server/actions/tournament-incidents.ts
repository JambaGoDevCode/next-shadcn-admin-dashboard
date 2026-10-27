"use server";

import { ApiError } from "@/lib/api/client";
import {
  createTournamentIncident,
  listTournamentIncidents,
  updateTournamentIncident,
} from "@/lib/api/tournament-incidents";
import type { TournamentIncident, TournamentIncidentCreateInput, TournamentIncidentStatus } from "@/lib/api/types";
import { getSessionTokens } from "@/lib/auth/session";

export type IncidentActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

async function requireToken(): Promise<string> {
  const { accessToken } = await getSessionTokens();
  if (!accessToken) throw new Error("unauthorized");
  return accessToken;
}

function toErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error && error.message === "unauthorized") return "Sessão expirada. Faça login novamente.";
  return "Não foi possível conectar à peladeiro-api.";
}

export async function listTournamentIncidentsAction(
  tournamentId: number,
): Promise<IncidentActionResult<TournamentIncident[]>> {
  try {
    const token = await requireToken();
    return { ok: true, data: await listTournamentIncidents(token, tournamentId) };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function createTournamentIncidentAction(
  input: TournamentIncidentCreateInput,
): Promise<IncidentActionResult<TournamentIncident>> {
  try {
    const token = await requireToken();
    return { ok: true, data: await createTournamentIncident(token, input) };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function updateTournamentIncidentAction(
  incidentId: number,
  input: { status: TournamentIncidentStatus; resolutionNote?: string },
): Promise<IncidentActionResult<TournamentIncident>> {
  try {
    const token = await requireToken();
    return { ok: true, data: await updateTournamentIncident(token, incidentId, input) };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}
