"use server";

import { getRecentUsers, getStoreOverview, getStoreOrders } from "@/lib/api/resources";
import type { OrderStatus, StoreOverview } from "@/lib/api/types";
import { formatKz, plural } from "@/lib/format";
import { getSessionTokens } from "@/lib/auth/session";

/** Linha pronta da tabela "Encomendas recentes" (mesma forma do `OrderRow` do template). */
export interface RecentOrderRow {
  id: string;
  date: string;
  customer: string;
  payment: "Paid" | "Pending" | "Refunded";
  total: string;
  items: string;
  fulfillment: "Fulfilled" | "Returned" | "Unfulfilled";
}

export interface EcommerceDashboardData {
  overview: StoreOverview;
  recentOrders: RecentOrderRow[];
  /** userId → nome, para os cartões de melhores clientes. */
  customerNames: Record<number, string>;
}

export type EcommerceDashboardResult =
  | { ok: true; data: EcommerceDashboardData }
  | { ok: false; error: string };

function paymentOf(status: OrderStatus): RecentOrderRow["payment"] {
  if (status === "PENDING_PAYMENT") return "Pending";
  if (status === "CANCELLED") return "Refunded";
  return "Paid";
}

function fulfillmentOf(status: OrderStatus): RecentOrderRow["fulfillment"] {
  if (status === "COMPLETED") return "Fulfilled";
  if (status === "CANCELLED") return "Returned";
  return "Unfulfilled";
}

/**
 * Visão geral do dashboard de ecommerce: `GET /store/analytics/overview`
 * + encomendas recentes + nomes de clientes, agregados numa só chamada.
 */
export async function getEcommerceDashboardAction(days = 14): Promise<EcommerceDashboardResult> {
  try {
    const { accessToken } = await getSessionTokens();
    const token = accessToken ?? "";

    const [overviewSettled, ordersSettled, usersSettled] = await Promise.allSettled([
      getStoreOverview(token, days),
      // `all=true` exige papel de administrador — sem ele, mostra as encomendas próprias.
      getStoreOrders(token, { all: true, limit: 25 }).catch(() => getStoreOrders(token, { limit: 25 })),
      getRecentUsers(token, 50),
    ]);

    if (overviewSettled.status === "rejected") {
      const cause = overviewSettled.reason;
      return {
        ok: false,
        error: cause instanceof Error ? cause.message : "Não foi possível carregar a visão geral da loja.",
      };
    }

    const orders = ordersSettled.status === "fulfilled" ? ordersSettled.value.items : [];
    const users = usersSettled.status === "fulfilled" ? usersSettled.value : [];
    const nameById = new Map(users.map((user) => [user.id, user.name]));

    const recentOrders: RecentOrderRow[] = [...orders]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((order) => ({
        id: order.orderNumber,
        date: order.createdAt,
        customer: nameById.get(order.userId) ?? `Cliente #${order.userId}`,
        payment: paymentOf(order.status),
        total: formatKz(order.totalAmount),
        items: `${order.itemCount} ${plural(order.itemCount, "item", "itens")}`,
        fulfillment: fulfillmentOf(order.status),
      }));

    const customerNames: Record<number, string> = {};
    for (const user of users) {
      customerNames[user.id] = user.name;
    }

    return { ok: true, data: { overview: overviewSettled.value, recentOrders, customerNames } };
  } catch (cause) {
    return {
      ok: false,
      error: cause instanceof Error ? cause.message : "Não foi possível carregar o dashboard da loja.",
    };
  }
}
