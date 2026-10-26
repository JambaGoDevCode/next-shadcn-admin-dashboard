import { NextResponse } from "next/server";

import { getProfile, login } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { buildSessionCookies } from "@/lib/auth/session";
import type { LoginOtpChallenge, LoginResult } from "@/lib/api/types";

interface LoginRequestBody {
  email?: unknown;
  password?: unknown;
}

export async function POST(request: Request) {
  let body: LoginRequestBody;
  try {
    body = (await request.json()) as LoginRequestBody;
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid request body." }, { status: 400 });
  }

  const { email, password } = body;
  if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
    return NextResponse.json({ ok: false, message: "Email and password are required." }, { status: 400 });
  }

  try {
    const result: LoginResult | LoginOtpChallenge = await login(email, password);

    // Contas com 2FA não recebem tokens neste passo — o cliente precisa de
    // completar o desafio OTP antes de abrir uma sessão.
    if (result.otpRequired) {
      return NextResponse.json({
        ok: true,
        otpRequired: true,
        challengeId: result.challengeId,
        destination: result.destination,
        expiresAt: result.expiresAt,
        developmentCode: result.developmentCode,
      });
    }

    const user = await getProfile(result.accessToken).catch(() => null);

    const response = NextResponse.json({
      ok: true,
      user: user ? { id: user.id, name: user.name, email: user.email } : null,
    });

    for (const cookie of buildSessionCookies(result)) {
      response.cookies.set(cookie.name, cookie.value, cookie.options);
    }

    return response;
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status >= 400 && error.status < 500 ? error.status : 502;
      return NextResponse.json({ ok: false, message: error.message }, { status });
    }
    console.error("[auth] unexpected error on login:", error);
    return NextResponse.json(
      { ok: false, message: "Could not reach peladeiro-api. Try again later." },
      { status: 502 },
    );
  }
}
