"use server";

import {
  addDepartmentMember,
  createDepartment,
  createTask,
  deleteDepartment,
  deleteTask,
  getDepartment,
  removeDepartmentMember,
  updateDepartment,
  updateTask,
} from "@/lib/api/resources";
import type { ActionResult, DepartmentInput, DepartmentItem, TaskInput, TaskItem } from "@/lib/api/types";
import { getSessionTokens } from "@/lib/auth/session";

/**
 * Executa uma chamada de escrita à API com o token da sessão e
 * devolve um resultado legível para os diálogos (`{ ok }` / erro).
 */
async function run<T>(operation: (token: string) => Promise<T>): Promise<ActionResult<T>> {
  const { accessToken } = await getSessionTokens();

  try {
    const data = await operation(accessToken ?? "");
    return { ok: true, data };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Erro ao comunicar com o servidor.",
    };
  }
}

// ============================================================
// DEPARTMENTS
// ============================================================

/** Cria o departamento e devolve a visão completa (com membros) para abrir o modo edição. */
export async function createDepartmentAction(input: DepartmentInput): Promise<ActionResult<DepartmentItem>> {
  return run(async (token) => {
    const created = await createDepartment(token, input);
    return getDepartment(token, created.id).catch(() => created);
  });
}

export async function updateDepartmentAction(
  id: number,
  input: Partial<DepartmentInput>,
): Promise<ActionResult<DepartmentItem>> {
  return run(async (token) => {
    await updateDepartment(token, id, input);
    // Devolve a visão completa (membros + contagens) para o diálogo
    // continuar em modo edição com dados frescos.
    return getDepartment(token, id);
  });
}

export async function deleteDepartmentAction(id: number): Promise<ActionResult> {
  return run(async (token) => {
    await deleteDepartment(token, id);
  });
}

// ============================================================
// MEMBERS
// ============================================================

export async function addMemberAction(departmentId: number, userId: number): Promise<ActionResult> {
  return run(async (token) => {
    await addDepartmentMember(token, departmentId, userId);
  });
}

export async function removeMemberAction(departmentId: number, userId: number): Promise<ActionResult> {
  return run(async (token) => {
    await removeDepartmentMember(token, departmentId, userId);
  });
}

// ============================================================
// TASKS
// ============================================================

export async function createTaskAction(input: TaskInput): Promise<ActionResult<TaskItem>> {
  return run((token) => createTask(token, input));
}

export async function updateTaskAction(id: number, input: Partial<TaskInput>): Promise<ActionResult<TaskItem>> {
  return run((token) => updateTask(token, id, input));
}

export async function deleteTaskAction(id: number): Promise<ActionResult> {
  return run(async (token) => {
    await deleteTask(token, id);
  });
}
