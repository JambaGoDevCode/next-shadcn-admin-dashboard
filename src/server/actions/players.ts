"use server";

import { ApiError } from "@/lib/api/client";
import {
  createPlayer,
  deletePlayer,
  getTeamPlayers,
  listPlayers,
  promoteCaptain,
  removeCaptain,
  updatePlayer,
} from "@/lib/api/management";
import type { Player, PlayerCreateInput, PlayerUpdateInput } from "@/lib/api/types";
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
    if (error.code === "FOREIGN_KEY_VIOLATION") return "O jogador está associado a outros registos.";
    return error.message;
  }
  if (error instanceof Error && error.message === "unauthorized") {
    return "Sessão expirada. Faça login novamente.";
  }
  return "Não foi possível conectar à peladeiro-api.";
}

/** Lista todos os jogadores (GET /players — a API não expõe filtros). */
export async function listPlayersAction(): Promise<ActionResult<Player[]>> {
  try {
    const token = await requireToken();
    return { ok: true, data: await listPlayers(token) };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

/** Elenco de uma equipa (GET /players/team/:teamId). */
export async function listTeamPlayersAction(teamId: number): Promise<ActionResult<Player[]>> {
  try {
    const token = await requireToken();
    return { ok: true, data: await getTeamPlayers(token, teamId) };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

/** Cria um jogador (POST /players) e devolve o id gerado. */
export async function createPlayerAction(input: PlayerCreateInput): Promise<ActionResult<string>> {
  try {
    const token = await requireToken();
    return { ok: true, data: await createPlayer(token, input) };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function updatePlayerAction(playerId: string, input: PlayerUpdateInput): Promise<ActionResult<void>> {
  try {
    const token = await requireToken();
    await updatePlayer(token, playerId, input);
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

/** Exclusão definitiva (DELETE /players/:id é hard delete na API). */
export async function deletePlayerAction(playerId: string): Promise<ActionResult<void>> {
  try {
    const token = await requireToken();
    await deletePlayer(token, playerId);
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function promoteCaptainAction(playerId: string): Promise<ActionResult<void>> {
  try {
    const token = await requireToken();
    await promoteCaptain(token, playerId);
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function removeCaptainAction(playerId: string): Promise<ActionResult<void>> {
  try {
    const token = await requireToken();
    await removeCaptain(token, playerId);
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}
