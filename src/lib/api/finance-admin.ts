import { apiFetch, extractData } from "./client";

/**
 * Módulo de pagamentos (`GET /payments`, `POST /payments/:id/refund`).
 * Mantém-se distinto do módulo financeiro — a administração financeira
 * consulta e opera sobre estes registos, não cria um sistema paralelo.
 */
export interface PlatformPayment {
  id: number;
  userId: number;
  cityId: number | null;
  teamId: number | null;
  tournamentId: number | null;
  matchId: number | null;
  amount: number;
  currency: string;
  status: string;
  method: string;
  reference: string;
  metadata: unknown;
  /**
   * Data derivada da referência `PAY-<epochMillis>-<rand>`: a tabela de
   * pagamentos não possui coluna de datas (`timestamps: false`).
   */
  createdAt: string | null;
}

interface RawPayment {
  id: number;
  userId: number;
  cityId?: number | null;
  teamId?: number | null;
  tournamentId?: number | null;
  matchId?: number | null;
  amount: number;
  currency?: string;
  status: string;
  method: string;
  reference: string;
  metadata?: unknown;
  createdAt?: string | null;
}

/** Extrai o instante de criação da referência `PAY-<epochMillis>-<sufixo>`. */
function deriveCreatedAt(reference: string): string | null {
  const match = /^PAY-(\d{10,})-/.exec(reference);
  if (!match) return null;
  const date = new Date(Number(match[1]));
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function normalizePayment(raw: RawPayment): PlatformPayment {
  return {
    id: raw.id,
    userId: raw.userId,
    cityId: raw.cityId ?? null,
    teamId: raw.teamId ?? null,
    tournamentId: raw.tournamentId ?? null,
    matchId: raw.matchId ?? null,
    amount: raw.amount,
    currency: raw.currency ?? "AOA",
    status: raw.status,
    method: raw.method,
    reference: raw.reference,
    metadata: raw.metadata ?? null,
    createdAt: raw.createdAt ?? deriveCreatedAt(raw.reference),
  };
}

/**
 * A API ignora os filtros de query (`GetPaymentsUseCase.execute()` não recebe
 * parâmetros), por isso a paginação e os filtros são feitos no cliente.
 */
export function listPayments(token: string): Promise<PlatformPayment[]> {
  return apiFetch<RawPayment[]>("/payments", { token }).then((payload) =>
    extractData<RawPayment[]>(payload).map(normalizePayment),
  );
}

/** Devolve o pagamento ao gateway/cliente — apenas pagamentos `PAID` são reembolsáveis. */
export function refundPlatformPayment(token: string, paymentId: number, amount?: number): Promise<PlatformPayment> {
  return apiFetch<RawPayment>(`/payments/${paymentId}/refund`, {
    method: "POST",
    token,
    body: amount === undefined ? {} : { amount },
  }).then((payload) => normalizePayment(extractData<RawPayment>(payload)));
}
