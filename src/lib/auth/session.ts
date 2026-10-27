import { cookies } from "next/headers";

import { isSecureCookiesEnabled } from "@/lib/api/env";
import type { AuthTokens } from "@/lib/api/types";

export const ACCESS_TOKEN_COOKIE = "peladeiro_access";
export const REFRESH_TOKEN_COOKIE = "peladeiro_refresh";

const ACCESS_TOKEN_MAX_AGE = 15 * 60; // matches the API's 15-minute access token
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60; // matches the API's 7-day refresh token
const EXPIRATION_SKEW_MS = 10 * 1000;

interface SessionCookieOptions {
  httpOnly: boolean;
  sameSite: "lax";
  secure: boolean;
  path: string;
  maxAge: number;
}

export interface SessionCookie {
  name: string;
  value: string;
  options: SessionCookieOptions;
}

function cookieOptions(maxAge: number): SessionCookieOptions {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: isSecureCookiesEnabled(),
    path: "/",
    maxAge,
  };
}

/** HttpOnly cookies that hold the peladeiro-api tokens. Set them from Route Handlers or the proxy. */
export function buildSessionCookies(tokens: AuthTokens): SessionCookie[] {
  return [
    {
      name: ACCESS_TOKEN_COOKIE,
      value: tokens.accessToken,
      options: cookieOptions(ACCESS_TOKEN_MAX_AGE),
    },
    {
      name: REFRESH_TOKEN_COOKIE,
      value: tokens.refreshToken,
      options: cookieOptions(REFRESH_TOKEN_MAX_AGE),
    },
  ];
}

export function clearedSessionCookies(): SessionCookie[] {
  return [
    { name: ACCESS_TOKEN_COOKIE, value: "", options: { ...cookieOptions(0), maxAge: 0 } },
    { name: REFRESH_TOKEN_COOKIE, value: "", options: { ...cookieOptions(0), maxAge: 0 } },
  ];
}

export interface SessionTokens {
  accessToken?: string;
  refreshToken?: string;
}

/** Reads the current session tokens from the request cookies (Server Components, Route Handlers). */
export async function getSessionTokens(): Promise<SessionTokens> {
  const store = await cookies();
  return {
    accessToken: store.get(ACCESS_TOKEN_COOKIE)?.value,
    refreshToken: store.get(REFRESH_TOKEN_COOKIE)?.value,
  };
}

/** Returns the JWT `exp` claim in milliseconds, or null when the token cannot be decoded. */
export function readTokenExpiration(token: string): number | null {
  const claims = readTokenClaims(token);
  return claims.exp;
}

export interface SessionClaims {
  userId: string | null;
  roles: string[];
  permissions: string[];
  exp: number | null;
}

/** Decodifica as claims do access token JWT (utilizador, papéis e permissões granulares). */
export function readTokenClaims(token: string): SessionClaims {
  const parts = token.split(".");
  if (parts.length < 2) return { userId: null, roles: [], permissions: [], exp: null };
  try {
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf-8")) as Record<string, unknown>;
    const asStringArray = (value: unknown): string[] =>
      Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : [];
    return {
      userId: typeof payload.sub === "string" ? payload.sub : null,
      roles: asStringArray(payload.roles),
      permissions: asStringArray(payload.permissions),
      exp: typeof payload.exp === "number" ? payload.exp * 1000 : null,
    };
  } catch {
    return { userId: null, roles: [], permissions: [], exp: null };
  }
}

/** True when the access token is expired or about to expire. Tokens without `exp` are treated as expired. */
export function isTokenExpired(token: string): boolean {
  const expiration = readTokenExpiration(token);
  if (expiration === null) return true;
  return Date.now() >= expiration - EXPIRATION_SKEW_MS;
}
