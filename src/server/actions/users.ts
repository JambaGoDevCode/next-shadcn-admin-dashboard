"use server";

import { revalidatePath } from "next/cache";

import {
  activateUser,
  assignRole,
  checkUserPermission,
  createProfile,
  deactivateUser,
  deleteUser,
  getCurrentSession,
  getUserById,
  getUserProfile,
  getUserRoles,
  registerAccount,
  removeRole,
  revokeOtherSessions,
  updateUser,
  updateUserProfile,
} from "@/lib/api/admin";
import { getProfile } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { findUserByEmail, getRecentUsers } from "@/lib/api/resources";
import type { AccountType, AdminUser, Profile, RecentUser, RegisterResult, Role, SessionInfo } from "@/lib/api/types";
import { getSessionTokens } from "@/lib/auth/session";

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

export interface UserContext {
  user: AdminUser;
  roles: Role[];
  profile: Profile | null;
}

async function requireToken(): Promise<string> {
  const { accessToken } = await getSessionTokens();
  if (!accessToken) throw new Error("unauthorized");
  return accessToken;
}

function toErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    // Rate limit dos endpoints de autenticação (registo/login/recuperação) — mensagem amigável em PT.
    if (error.status === 429) return "Limite de pedidos excedido. Aguarde alguns minutos e tente novamente.";
    return error.message;
  }
  if (error instanceof Error && error.message === "unauthorized") {
    return "Sessão expirada. Faça login novamente.";
  }
  return "Não foi possível conectar à peladeiro-api.";
}

/** Carrega o contexto completo (usuário + papéis + perfil) por id. */
async function loadUserContext(token: string, userId: number): Promise<UserContext> {
  const user = await getUserById(token, userId);
  const [roles, profile] = await Promise.all([
    getUserRoles(token, user.id).catch(() => [] as Role[]),
    getUserProfile(token, user.id).catch(() => null),
  ]);
  return { user, roles, profile };
}

/** Lookup por e-mail exato — busca pontual quando o usuário não está na lista recente. */
export async function searchUserAction(email: string): Promise<ActionResult<UserContext>> {
  try {
    const token = await requireToken();
    const found = await findUserByEmail(token, email);
    return { ok: true, data: await loadUserContext(token, found.id) };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

/** Lista os usuários mais recentes (GET /users/recent — até 100, o máximo que a API expõe). */
export async function listUsersAction(limit = 100): Promise<ActionResult<RecentUser[]>> {
  try {
    const token = await requireToken();
    const users = await getRecentUsers(token, limit);
    return { ok: true, data: users };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

/** Contexto completo de um usuário selecionado na lista (GET /users/:id + papéis + perfil). */
export async function getUserContextAction(userId: number): Promise<ActionResult<UserContext>> {
  try {
    const token = await requireToken();
    return { ok: true, data: await loadUserContext(token, userId) };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

/** Creates a login-capable account via POST /auth/register (rate-limited to 5 per 15 min by the API). */
export async function createUserAction(input: {
  name: string;
  email: string;
  password: string;
  accountType: AccountType;
}): Promise<ActionResult<RegisterResult>> {
  try {
    await requireToken();
    const result = await registerAccount(input);
    revalidatePath("/dashboard/users");
    return { ok: true, data: result };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function updateUserAction(
  userId: number,
  body: { name?: string; email?: string },
): Promise<ActionResult<AdminUser>> {
  try {
    const token = await requireToken();
    const user = await updateUser(token, userId, body);
    revalidatePath("/dashboard/users");
    return { ok: true, data: user };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function setUserActiveAction(userId: number, active: boolean): Promise<ActionResult<AdminUser>> {
  try {
    const token = await requireToken();
    const user = active ? await activateUser(token, userId) : await deactivateUser(token, userId);
    revalidatePath("/dashboard/users");
    return { ok: true, data: user };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function deleteUserAction(userId: number): Promise<ActionResult<void>> {
  try {
    const token = await requireToken();
    await deleteUser(token, userId);
    revalidatePath("/dashboard/users");
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function assignRoleAction(userId: number, roleId: number): Promise<ActionResult<void>> {
  try {
    const token = await requireToken();
    await assignRole(token, userId, roleId);
    revalidatePath("/dashboard/users");
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function removeRoleAction(userId: number, roleId: number): Promise<ActionResult<void>> {
  try {
    const token = await requireToken();
    await removeRole(token, userId, roleId);
    revalidatePath("/dashboard/users");
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function updateProfileAction(userId: number, body: Partial<Profile>): Promise<ActionResult<Profile>> {
  try {
    const token = await requireToken();
    const profile = await updateUserProfile(token, userId, body);
    revalidatePath("/dashboard/users");
    revalidatePath("/dashboard/profile");
    return { ok: true, data: profile };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function createProfileAction(userId: number): Promise<ActionResult<Profile>> {
  try {
    const token = await requireToken();
    const profile = await createProfile(token, userId);
    revalidatePath("/dashboard/users");
    return { ok: true, data: profile };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export interface MyAccount {
  profile: Profile | null;
  user: AdminUser | null;
  session: SessionInfo | null;
}

/** Current admin account: profile (me), full user and active session. */
export async function getMyAccountAction(): Promise<ActionResult<MyAccount>> {
  try {
    const token = await requireToken();
    const [profile, session] = await Promise.all([
      getProfile(token).catch(() => null),
      getCurrentSession(token).catch(() => null),
    ]);
    const user = profile ? await getUserById(token, profile.userId).catch(() => null) : null;
    return { ok: true, data: { profile, user, session } };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function revokeOtherSessionsAction(): Promise<ActionResult<void>> {
  try {
    const token = await requireToken();
    await revokeOtherSessions(token);
    return { ok: true, data: undefined };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export async function checkPermissionAction(userId: number, permission: string): Promise<ActionResult<boolean>> {
  try {
    const token = await requireToken();
    const allowed = await checkUserPermission(token, userId, permission);
    return { ok: true, data: allowed };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}
