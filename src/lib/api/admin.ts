import { apiFetch, extractData } from "./client";
import type { AccountType, AdminUser, Profile, RegisterResult, Role, SessionInfo } from "./types";

/**
 * The 10 system roles created by the API seed migration (fixed IDs).
 * The API has no "list all roles" endpoint, so IDs must be referenced directly.
 */
export const SYSTEM_ROLES: ReadonlyArray<{ id: number; name: string; description: string }> = [
  { id: 1, name: "USER", description: "Usuário base da plataforma" },
  { id: 2, name: "PLAYER", description: "Jogador" },
  { id: 3, name: "TEAM_OWNER", description: "Dono de time" },
  { id: 4, name: "FIELD_OWNER", description: "Dono de quadra" },
  { id: 5, name: "ORGANIZER", description: "Organizador de campeonatos" },
  { id: 6, name: "MODERATOR", description: "Moderador" },
  { id: 7, name: "ADMIN", description: "Administrador" },
  { id: 8, name: "SUPER_ADMIN", description: "Super administrador" },
  { id: 9, name: "PLATFORM_MANAGER", description: "Gestor da plataforma" },
  { id: 10, name: "TEAM_MANAGER", description: "Gerente de time" },
];

/** Creates a login-capable account (POST /auth/register). Rate-limited to 5 per 15 min by the API. */
export function registerAccount(input: {
  name: string;
  email: string;
  password: string;
  accountType: AccountType;
}): Promise<RegisterResult> {
  return apiFetch<RegisterResult>("/auth/register", { method: "POST", body: input });
}

export function getUserById(token: string, userId: number): Promise<AdminUser> {
  return apiFetch<AdminUser>(`/users/${userId}`, { token }).then(extractData<AdminUser>);
}

export function updateUser(
  token: string,
  userId: number,
  body: { name?: string; email?: string; phone?: string },
): Promise<AdminUser> {
  return apiFetch<AdminUser>(`/users/${userId}`, { method: "PATCH", body, token }).then(extractData<AdminUser>);
}

export function activateUser(token: string, userId: number): Promise<AdminUser> {
  return apiFetch<AdminUser>(`/users/${userId}/activate`, { method: "PATCH", token }).then(extractData<AdminUser>);
}

export function deactivateUser(token: string, userId: number): Promise<AdminUser> {
  return apiFetch<AdminUser>(`/users/${userId}/deactivate`, { method: "PATCH", token }).then(extractData<AdminUser>);
}

/** Soft delete — the API only flips the user to INACTIVE. Returns 204 (no content). */
export function deleteUser(token: string, userId: number): Promise<void> {
  return apiFetch(`/users/${userId}`, { method: "DELETE", token });
}

/**
 * The roles endpoint currently returns the entity's private fields (`_id`, `_name`, ...).
 * This normalizer accepts both that shape and a future public one.
 */
function normalizeRole(item: unknown): Role {
  if (!item || typeof item !== "object") return { id: 0, name: "UNKNOWN" };
  const record = item as Record<string, unknown>;
  const pick = <T>(key: string): T | undefined =>
    key in record ? (record[key] as T) : (record[`_${key}`] as T | undefined);
  return {
    id: pick<number>("id") ?? 0,
    name: pick<string>("name") ?? "",
    description: pick<string | null>("description") ?? null,
    system: pick<boolean>("system") ?? false,
    active: pick<boolean>("active") ?? false,
  };
}

export function getUserRoles(token: string, userId: number): Promise<Role[]> {
  return apiFetch<unknown[]>(`/users/roles/users/${userId}`, { token }).then((payload) => {
    const data = extractData<unknown[]>(payload);
    return Array.isArray(data) ? data.map(normalizeRole) : [];
  });
}

export function assignRole(token: string, userId: number, roleId: number): Promise<unknown> {
  return apiFetch(`/users/roles/users/${userId}`, { method: "POST", body: { roleId }, token });
}

export function removeRole(token: string, userId: number, roleId: number): Promise<unknown> {
  return apiFetch(`/users/roles/users/${userId}`, { method: "DELETE", body: { roleId }, token });
}

export function getUserProfile(token: string, userId: number): Promise<Profile> {
  return apiFetch<Profile>(`/users/profile/${userId}`, { token }).then(extractData<Profile>);
}

export function createProfile(token: string, userId: number): Promise<Profile> {
  return apiFetch<Profile>("/users/profile", { method: "POST", body: { userId }, token }).then(extractData<Profile>);
}

export function updateUserProfile(token: string, userId: number, body: Partial<Profile>): Promise<Profile> {
  return apiFetch<Profile>(`/users/profile/${userId}`, { method: "PATCH", body, token }).then(extractData<Profile>);
}

export function getCurrentSession(token: string): Promise<SessionInfo> {
  return apiFetch<SessionInfo>("/sessions/current", { token }).then(extractData<SessionInfo>);
}

/**
 * POST /auth/forgot-password (público) — gera um token de recuperação de senha.
 * Fora de produção a API devolve `developmentToken` (o serviço de e-mail é no-op).
 */
export function forgotPassword(email: string): Promise<{ developmentToken?: string }> {
  return apiFetch<{ developmentToken?: string }>("/auth/forgot-password", {
    method: "POST",
    body: { email },
  });
}

/** POST /auth/reset-password (público) — troca a senha usando o token de recuperação. */
export function resetPassword(token: string, newPassword: string): Promise<void> {
  return apiFetch("/auth/reset-password", { method: "POST", body: { token, newPassword } });
}

/** Revokes every session except the current one. */
export function revokeOtherSessions(token: string): Promise<void> {
  return apiFetch("/sessions/all", { method: "DELETE", token });
}

/** Requires a Bearer token with the ADMIN role. */
export function checkUserPermission(token: string, userId: number, permission: string): Promise<boolean> {
  return apiFetch<boolean>(`/authorization/users/${userId}/permissions/${permission}`, { token }).then(
    extractData<boolean>,
  );
}
