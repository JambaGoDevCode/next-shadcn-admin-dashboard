import { apiFetch, extractData } from "./client";
import type { AuthTokens, LoginOtpChallenge, LoginResult, SessionUser } from "./types";

export async function login(email: string, password: string): Promise<LoginResult | LoginOtpChallenge> {
  return apiFetch<LoginResult | LoginOtpChallenge>("/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

export async function verifyLoginOtp(challengeId: number, code: string): Promise<LoginResult> {
  return apiFetch<LoginResult>("/auth/login/verify-otp", {
    method: "POST",
    body: { challengeId, code },
  });
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
}

export async function register(input: RegisterInput): Promise<{ userId: number; email: string; status: string }> {
  return apiFetch<{ userId: number; email: string; status: string }>("/auth/register", { method: "POST", body: input });
}

export async function refreshSession(refreshToken: string): Promise<AuthTokens> {
  return apiFetch<AuthTokens>("/auth/refresh", {
    method: "POST",
    body: { refreshToken },
  });
}

export async function logout(token: string): Promise<void> {
  await apiFetch("/auth/logout", { method: "POST", token });
}

export async function getProfile(token: string): Promise<SessionUser> {
  const payload = await apiFetch<unknown>("/users/profile/me", { token });
  return extractData<SessionUser>(payload);
}
