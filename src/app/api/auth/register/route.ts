import { NextResponse } from "next/server";

import { ApiError } from "@/lib/api/client";
import { register } from "@/lib/api/auth";

interface RegisterRequestBody {
  email?: unknown;
  password?: unknown;
  firstName?: unknown;
  lastName?: unknown;
}

export async function POST(request: Request) {
  let body: RegisterRequestBody;
  try {
    body = (await request.json()) as RegisterRequestBody;
  } catch {
    return NextResponse.json({ ok: false, message: "Pedido inválido." }, { status: 400 });
  }

  if (
    typeof body.email !== "string" ||
    typeof body.password !== "string" ||
    typeof body.firstName !== "string" ||
    (body.lastName !== undefined && typeof body.lastName !== "string")
  ) {
    return NextResponse.json({ ok: false, message: "Preenche os campos obrigatórios." }, { status: 400 });
  }

  try {
    const result = await register({
      email: body.email,
      password: body.password,
      name: [body.firstName, body.lastName].filter((name): name is string => typeof name === "string" && name.trim().length > 0).join(" "),
    });
    return NextResponse.json({ ok: true, data: result }, { status: 201 });
  } catch (error) {
    if (error instanceof ApiError) {
      const status = error.status >= 400 && error.status < 500 ? error.status : 502;
      return NextResponse.json({ ok: false, message: error.message }, { status });
    }
    return NextResponse.json({ ok: false, message: "Não foi possível contactar o servidor." }, { status: 502 });
  }
}
