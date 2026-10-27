import { apiFetch, extractData } from "./client";
import type { TournamentIncident, TournamentIncidentCreateInput, TournamentIncidentStatus } from "./types";

function toArray<T>(payload: unknown): T[] {
  const data = extractData<T[] | T>(payload);
  if (Array.isArray(data)) return data;
  return data ? [data] : [];
}

export async function listTournamentIncidents(token: string, tournamentId: number): Promise<TournamentIncident[]> {
  const payload = await apiFetch<unknown>(`/tournament-incidents?tournamentId=${tournamentId}`, { token });
  return toArray<TournamentIncident>(payload);
}

export async function createTournamentIncident(
  token: string,
  input: TournamentIncidentCreateInput,
): Promise<TournamentIncident> {
  const payload = await apiFetch<unknown>("/tournament-incidents", {
    method: "POST",
    body: input,
    token,
  });
  return extractData<TournamentIncident>(payload);
}

export async function updateTournamentIncident(
  token: string,
  incidentId: number,
  input: { status: TournamentIncidentStatus; resolutionNote?: string },
): Promise<TournamentIncident> {
  const payload = await apiFetch<unknown>(`/tournament-incidents/${incidentId}`, {
    method: "PATCH",
    body: input,
    token,
  });
  return extractData<TournamentIncident>(payload);
}
