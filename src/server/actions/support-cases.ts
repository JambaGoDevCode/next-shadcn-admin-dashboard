"use server";

import { ApiError } from "@/lib/api/client";
import {
  createSupportCase,
  getSupportCase,
  listSupportCaseAssignees,
  listSupportCases,
  respondToSupportCase,
  updateSupportCase,
} from "@/lib/api/support-cases";
import type {
  SupportCase,
  SupportCaseActivity,
  SupportCaseAssignee,
  SupportCaseFilters,
  SupportCaseInput,
  SupportCaseUpdate,
} from "@/lib/api/types";
import { getSessionTokens } from "@/lib/auth/session";

export type SupportCaseActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

async function withSession<T>(operation: (token: string) => Promise<T>): Promise<SupportCaseActionResult<T>> {
  try {
    const { accessToken } = await getSessionTokens();
    if (!accessToken) return { ok: false, error: "Sessão expirada. Inicie sessão novamente." };
    return { ok: true, data: await operation(accessToken) };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Não foi possível concluir a operação.",
    };
  }
}

export async function listSupportCasesAction(
  filters: SupportCaseFilters = {},
): Promise<SupportCaseActionResult<SupportCase[]>> {
  return withSession((token) => listSupportCases(token, filters));
}

export async function getSupportCaseAction(caseId: number): Promise<SupportCaseActionResult<SupportCase>> {
  return withSession((token) => getSupportCase(token, caseId));
}

export async function listSupportCaseAssigneesAction(): Promise<SupportCaseActionResult<SupportCaseAssignee[]>> {
  return withSession(listSupportCaseAssignees);
}

export async function createSupportCaseAction(input: SupportCaseInput): Promise<SupportCaseActionResult<SupportCase>> {
  return withSession((token) => createSupportCase(token, input));
}

export async function updateSupportCaseAction(
  caseId: number,
  input: SupportCaseUpdate,
): Promise<SupportCaseActionResult<SupportCase>> {
  return withSession((token) => updateSupportCase(token, caseId, input));
}

export async function respondToSupportCaseAction(
  caseId: number,
  message: string,
): Promise<SupportCaseActionResult<SupportCaseActivity>> {
  return withSession((token) => respondToSupportCase(token, caseId, message));
}
