import { apiFetch, extractData } from "./client";
import type {
  SupportCase,
  SupportCaseActivity,
  SupportCaseAssignee,
  SupportCaseFilters,
  SupportCaseInput,
  SupportCaseUpdate,
} from "./types";

function toList<T>(payload: unknown): T[] {
  const data = extractData<T[] | T>(payload);
  if (Array.isArray(data)) return data;
  return data ? [data] : [];
}

export async function listSupportCases(token: string, filters: SupportCaseFilters = {}): Promise<SupportCase[]> {
  const query = new URLSearchParams();
  if (filters.type) query.set("type", filters.type);
  if (filters.status) query.set("status", filters.status);
  if (filters.priority) query.set("priority", filters.priority);
  if (filters.assignedUserId) query.set("assignedUserId", String(filters.assignedUserId));
  if (filters.history) query.set("history", "true");
  const path = query.size ? `/support-cases?${query.toString()}` : "/support-cases";
  const payload = await apiFetch<unknown>(path, { token });
  return toList<SupportCase>(payload);
}

export async function getSupportCase(token: string, caseId: number): Promise<SupportCase> {
  return apiFetch<SupportCase>(`/support-cases/${caseId}`, { token }).then(extractData<SupportCase>);
}

export async function listSupportCaseAssignees(token: string): Promise<SupportCaseAssignee[]> {
  const payload = await apiFetch<unknown>("/support-cases/assignees", { token });
  return toList<SupportCaseAssignee>(payload);
}

export async function createSupportCase(token: string, input: SupportCaseInput): Promise<SupportCase> {
  return apiFetch<SupportCase>("/support-cases", { method: "POST", body: input, token }).then(extractData<SupportCase>);
}

export async function updateSupportCase(token: string, caseId: number, input: SupportCaseUpdate): Promise<SupportCase> {
  return apiFetch<SupportCase>(`/support-cases/${caseId}`, { method: "PATCH", body: input, token }).then(
    extractData<SupportCase>,
  );
}

export async function respondToSupportCase(
  token: string,
  caseId: number,
  message: string,
): Promise<SupportCaseActivity> {
  return apiFetch<SupportCaseActivity>(`/support-cases/${caseId}/responses`, {
    method: "POST",
    body: { message },
    token,
  }).then(extractData<SupportCaseActivity>);
}
