import { NextResponse } from "next/server";

import { logout } from "@/lib/api/auth";
import { clearedSessionCookies, getSessionTokens } from "@/lib/auth/session";

export async function POST() {
  const { accessToken } = await getSessionTokens();

  // Invalidate the server-side session when possible; always clear local cookies.
  if (accessToken) {
    try {
      await logout(accessToken);
    } catch {
      // The token may already be expired — clearing cookies below is enough.
    }
  }

  const response = NextResponse.json({ ok: true });
  for (const cookie of clearedSessionCookies()) {
    response.cookies.set(cookie.name, cookie.value, cookie.options);
  }
  return response;
}
