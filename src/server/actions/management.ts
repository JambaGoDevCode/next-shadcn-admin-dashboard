"use server";

import { getCurrentSession } from "@/lib/api/admin";
import { ApiError, apiFetch, extractData } from "@/lib/api/client";
import {
  createCity,
  createField,
  createTeam,
  deleteCity,
  deleteField,
  deleteTeam,
  getAllTeams,
  updateCity,
  updateField,
  updateTeam,
} from "@/lib/api/management";
import { getCities, getFields, getMatchesByField, getTeams } from "@/lib/api/resources";
import type {
  Booking,
  City,
  CityInput,
  Field,
  FieldInput,
  FieldQuality,
  FieldQualityCriteria,
  FieldUpdateInput,
  Match,
  Team,
  TeamInput,
  TeamUpdateInput,
} from "@/lib/api/types";
import { getSessionTokens } from "@/lib/auth/session";

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

async function requireToken(): Promise<string> {
  const { accessToken } = await getSessionTokens();
  if (!accessToken) throw new Error("unauthorized");
  return accessToken;
}

function toErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 429) return "Limite de pedidos excedido. Aguarde alguns minutos e tente novamente.";
    if (error.code === "FOREIGN_KEY_VIOLATION") {
      return "O registo está associado a outros dados e não pode ser eliminado.";
    }
    return error.message;
  }
  if (error instanceof Error && error.message === "unauthorized") {
    return "Sessão expirada. Faça login novamente.";
  }
  return "Não foi possível conectar à peladeiro-api.";
}

// --- Cidades -----------------------------------------------------------------

/** Lista as cidades ativas (GET /cities). */
export async function listCitiesAction(): Promise<ActionResult<City[]>> {
  try {
    const token = await requireToken();
    return { ok: true, data: await getCities(token) };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function createCityAction(input: CityInput): Promise<ActionResult<City>> {
  try {
    const token = await requireToken();
    return { ok: true, data: await createCity(token, input) };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function updateCityAction(cityId: number, input: CityInput): Promise<ActionResult<City>> {
  try {
    const token = await requireToken();
    return { ok: true, data: await updateCity(token, cityId, input) };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function deleteCityAction(cityId: number): Promise<ActionResult<void>> {
  try {
    const token = await requireToken();
    await deleteCity(token, cityId);
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

// --- Campos ------------------------------------------------------------------

/** Lista os campos ativos (GET /fields — opcionalmente por cidade). */
export async function listFieldsAction(): Promise<ActionResult<Field[]>> {
  try {
    const token = await requireToken();
    return { ok: true, data: await getFields(token) };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function createFieldAction(input: FieldInput): Promise<ActionResult<Field>> {
  try {
    const token = await requireToken();
    return { ok: true, data: await createField(token, input) };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function updateFieldAction(fieldId: number, input: FieldUpdateInput): Promise<ActionResult<Field>> {
  try {
    const token = await requireToken();
    return { ok: true, data: await updateField(token, fieldId, input) };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function deleteFieldAction(fieldId: number): Promise<ActionResult<void>> {
  try {
    const token = await requireToken();
    await deleteField(token, fieldId);
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

// --- Reservas e qualidade de campos ---------------------------------------------

/** Reservas de um campo (ou todas, quando `fieldId` é omitido) — GET /bookings?fieldId=. */
export async function listBookingsAction(fieldId?: number): Promise<ActionResult<Booking[]>> {
  try {
    const token = await requireToken();
    const bookings = await apiFetch<Booking[]>(fieldId ? `/bookings?fieldId=${fieldId}` : "/bookings", { token });
    return { ok: true, data: bookings };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

/** Qualidade consolidada de um campo (GET /fields/quality/:fieldId). */
export async function getFieldQualityAction(fieldId: number): Promise<ActionResult<FieldQuality | null>> {
  try {
    const token = await requireToken();
    const payload = await apiFetch<unknown>(`/fields/quality/${fieldId}`, { token });
    const quality = extractData<FieldQuality | null>(payload);
    return { ok: true, data: quality };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

/** Regista uma avaliação por critério num campo (POST /fields/quality/rate). */
export async function rateFieldAction(input: {
  fieldId: number;
  criteria: FieldQualityCriteria;
  value: number;
  comment?: string;
}): Promise<ActionResult<void>> {
  try {
    const token = await requireToken();
    const session = await getCurrentSession(token);
    await apiFetch("/fields/quality/rate", {
      method: "POST",
      body: { ...input, userId: String(session.userId) },
      token,
    });
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

/** Partidas associadas a um campo (GET /matches/field/:fieldId). */
export async function listFieldMatchesAction(fieldId: number): Promise<ActionResult<Match[]>> {
  try {
    const token = await requireToken();
    const matches = await getMatchesByField(token, fieldId);
    return { ok: true, data: matches };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

// --- Equipas -----------------------------------------------------------------

/** Lista as equipas ativas (GET /teams). */
export async function listTeamsAction(): Promise<ActionResult<Team[]>> {
  try {
    const token = await requireToken();
    return { ok: true, data: await getTeams(token) };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

/**
 * Lista todas as equipas, incluindo as inactivas — `GET /teams` só devolve activas,
 * por isso os ids omissos são sondados via `GET /teams/:id` (ver `getAllTeams`).
 */
export async function listAllTeamsAction(): Promise<ActionResult<Team[]>> {
  try {
    const token = await requireToken();
    return { ok: true, data: await getAllTeams(token) };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function createTeamAction(input: TeamInput): Promise<ActionResult<Team>> {
  try {
    const token = await requireToken();
    return { ok: true, data: await createTeam(token, input) };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function updateTeamAction(teamId: number, input: TeamUpdateInput): Promise<ActionResult<Team>> {
  try {
    const token = await requireToken();
    return { ok: true, data: await updateTeam(token, teamId, input) };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function deleteTeamAction(teamId: number): Promise<ActionResult<void>> {
  try {
    const token = await requireToken();
    await deleteTeam(token, teamId);
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}
