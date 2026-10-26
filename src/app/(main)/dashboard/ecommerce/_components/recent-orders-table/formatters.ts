import type React from "react";

import type { OrderFilter } from "./schema";

export function formatOrderCount(filter: OrderFilter, count: number) {
  const orderLabel = count === 1 ? "encomenda" : "encomendas";

  if (filter === "All") {
    return `${count.toLocaleString("pt-PT")} ${orderLabel}`;
  }

  const filterLabels: Record<Exclude<OrderFilter, "All">, string> = {
    "Needs action": "requer ação",
    Unfulfilled: "por expedir",
    Unpaid: "por pagar",
    Returns: "em devolução",
  };

  return `${count.toLocaleString("pt-PT")} ${orderLabel} (${filterLabels[filter]})`;
}

export function formatSelectedOrderCount(count: number) {
  const orderLabel = count === 1 ? "encomenda selecionada" : "encomendas selecionadas";

  return `${count.toLocaleString("pt-PT")} ${orderLabel}`;
}

export function preventPaginationNavigation(event: React.MouseEvent<HTMLAnchorElement>) {
  event.preventDefault();
}
