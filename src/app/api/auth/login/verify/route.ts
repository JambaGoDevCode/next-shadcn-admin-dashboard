import { NextResponse } from "next/server";

import { verifyLoginOtp } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { buildSessionCookies } from "@/lib/auth/session";

interface VerifyOtpRequestBody {
  challengeId?: unknown;
  code?: unknown;
}

/** Second step of the OTP login flow: exchanges the verified challenge for session cookies. */
export async function POST(request: Request) {
  let body: VerifyOtpRequestBody;
  try {
    body = (await request.json()) as VerifyOtpRequestBody;
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid request body." }, { status: 400 });
  }

  const { challengeId, code } = body;
  if (typeof challengeId !== "number" && typeof challengeId !== "string") {
    return NextResponse.json({ ok: false, message: "Challenge ID is required." }, { status: 400 });
  }
  if (typeof code !== "string" || !code.trim()) {
    return NextResponse.json({ ok: false, message: "Verification code is required." }, { status: 400 });
  }

  try {
    const tokens = await verifyLoginOtp(Number(challengeId), code.trim());

    const response = NextResponse.json({ ok: true });

    for (const cookie of buildSessionCookies(tokens)) {
      response.cookies.set(cookie.name, cookie.value, cookie.options);
    }

    return response;
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status >= 400 && error.status < 500 ? error.status : 502;
      return NextResponse.json({ ok: false, message: error.message }, { status });
    }
    console.error("[auth] unexpected error on login OTP verification:", error);
    return NextResponse.json(
      { ok: false, message: "Could not reach peladeiro-api. Try again later." },
      { status: 502 },
    );
  }
}
