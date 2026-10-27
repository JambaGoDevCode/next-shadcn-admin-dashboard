"use server";

import { ApiError } from "@/lib/api/client";
import { listPayments, type PlatformPayment, refundPlatformPayment } from "@/lib/api/finance-admin";
import { getStoreOrders } from "@/lib/api/resources";
import type { ActionResult, StoreOrderList } from "@/lib/api/types";
import { getSessionTokens, readTokenClaims } from "@/lib/auth/session";

/** Permissão granular da API exigida para operações financeiras sensíveis. */
const REFUND_PERMISSION = "PAYMENT_REFUND";

/**
 * Quando o access token não transporta permissões granulares, a operação é
 * validada pelo papel da sessão: administração da plataforma ou organização.
 */
const REFUND_FALLBACK_ROLES = ["ADMIN", "SUPER_ADMIN", "PLATFORM_MANAGER", "ORGANIZER"];

export interface RefundOutcome {
  payment: PlatformPayment;
  /** Registo legível da operação auditável (actor + momento). */
  audit: string;
}

interface RefundInput {
  paymentId: number;
  amount?: number;
}

function toErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) return "Sessão expirada. Faça login novamente.";
    if (error.status === 403) return "A sua sessão não tem autorização para esta operação financeira.";
    if (error.status === 404) return "Pagamento não encontrado.";
    if (error.status === 429) return "Limite de pedidos excedido. Aguarde alguns minutos e tente novamente.";
    if (error.message.startsWith("Only paid payments can be refunded")) {
      return "Só pagamentos liquidados (PAID) podem ser reembolsados.";
    }
    if (error.message.startsWith("amount must be")) return "O valor de reembolso tem de ser um número positivo.";
    return error.message;
  }
  if (error instanceof Error && error.message === "unauthorized") {
    return "Sessão expirada. Faça login novamente.";
  }
  return "Não foi possível conectar à peladeiro-api.";
}

/** Lista de pagamentos da plataforma (paginação e filtros são feitos no cliente). */
export async function listPaymentsAction(): Promise<ActionResult<PlatformPayment[]>> {
  try {
    const { accessToken } = await getSessionTokens();
    if (!accessToken) return { ok: false, error: "Sessão expirada. Faça login novamente." };
    return { ok: true, data: await listPayments(accessToken) };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

/**
 * Executa o reembolso de um pagamento da plataforma.
 *
 * Operação sensível: valida a permissão/papel da sessão antes de chamar a API e
 * regista no log do servidor quem executou, quando e sobre qual pagamento.
 */
export async function refundPlatformPaymentAction(input: RefundInput): Promise<ActionResult<RefundOutcome>> {
  try {
    const { accessToken } = await getSessionTokens();
    if (!accessToken) return { ok: false, error: "Sessão expirada. Faça login novamente." };

    const claims = readTokenClaims(accessToken);
    const hasGranularPermissions = claims.permissions.length > 0;
    const allowed = hasGranularPermissions
      ? claims.permissions.includes(REFUND_PERMISSION)
      : claims.roles.some((role) => REFUND_FALLBACK_ROLES.includes(role.toUpperCase()));

    if (!allowed) {
      return {
        ok: false,
        error: `A sua sessão não dispõe da permissão ${REFUND_PERMISSION} para reembolsar pagamentos.`,
      };
    }

    const payment = await refundPlatformPayment(accessToken, input.paymentId, input.amount);
    const executedAt = new Date().toISOString();
    const actor = claims.userId ?? "desconhecido";
    const roles = claims.roles.join(", ") || "sem papel";
    const audit = `Reembolso do pagamento #${payment.id} (${payment.reference}) executado por ${actor} · ${roles} em ${executedAt}.`;

    console.info(
      JSON.stringify({
        audit: "finance.refund",
        paymentId: payment.id,
        reference: payment.reference,
        amount: input.amount ?? payment.amount,
        actor,
        roles: claims.roles,
        executedAt,
      }),
    );

    return { ok: true, data: { payment, audit } };
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}

export interface StoreOrdersResult {
  list: StoreOrderList;
  /** `all` = listagem global (exige perfil admin); `own` = apenas encomendas da sessão. */
  scope: "all" | "own";
}

/**
 * Lista de encomendas da loja para a área financeira.
 * `GET /store/orders?all=true` exige papel administrativo — sem esse papel a
 * listagem cai para as encomendas da própria sessão e o âmbito é devolvido para
 * a interface o assinalar.
 */
export async function listStoreOrdersAction(query?: {
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<ActionResult<StoreOrdersResult>> {
  try {
    const { accessToken } = await getSessionTokens();
    if (!accessToken) return { ok: false, error: "Sessão expirada. Faça login novamente." };

    try {
      const list = await getStoreOrders(accessToken, { all: true, ...query });
      return { ok: true, data: { list, scope: "all" } };
    } catch (error) {
      if (error instanceof ApiError && (error.status === 403 || error.status === 401)) {
        const list = await getStoreOrders(accessToken, query);
        return { ok: true, data: { list, scope: "own" } };
      }
      throw error;
    }
  } catch (error) {
    return { ok: false, error: toErrorMessage(error) };
  }
}
