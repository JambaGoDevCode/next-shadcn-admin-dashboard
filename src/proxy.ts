import { type NextRequest, NextResponse } from "next/server";

import { refreshSession } from "@/lib/api/auth";
import type { AuthTokens } from "@/lib/api/types";
import {
  ACCESS_TOKEN_COOKIE,
  buildSessionCookies,
  clearedSessionCookies,
  isTokenExpired,
  REFRESH_TOKEN_COOKIE,
} from "@/lib/auth/session";

const LOGIN_PATH = "/auth/v2/login";

/**
 * Optimistic session check for the dashboard. When the access token is missing or
 * expired, it rotates the refresh token via peladeiro-api and forwards the new
 * cookies, or redirects to the login page when the session is no longer valid.
 */
export async function proxy(request: NextRequest) {
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;

  if (accessToken && !isTokenExpired(accessToken)) {
    return NextResponse.next();
  }

  if (refreshToken) {
    try {
      const tokens: AuthTokens = await refreshSession(refreshToken);
      const response = NextResponse.next();
      for (const cookie of buildSessionCookies(tokens)) {
        response.cookies.set(cookie.name, cookie.value, cookie.options);
      }
      return response;
    } catch {
      // Refresh token was rejected — fall through to the login redirect.
    }
  }

  const loginUrl = new URL(LOGIN_PATH, request.url);
  loginUrl.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);

  const response = NextResponse.redirect(loginUrl);
  for (const cookie of clearedSessionCookies()) {
    response.cookies.set(cookie.name, cookie.value, cookie.options);
  }
  return response;
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
