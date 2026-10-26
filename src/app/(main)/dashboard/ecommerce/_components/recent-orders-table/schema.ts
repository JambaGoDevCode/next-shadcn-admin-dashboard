export const orderFilters = ["All", "Needs action", "Unfulfilled", "Unpaid", "Returns"] as const;

export type OrderFilter = (typeof orderFilters)[number];

/** Rótulos PT dos filtros (os valores internos mantêm-se em inglês). */
export const orderFilterLabels: Record<OrderFilter, string> = {
  All: "Todas",
  "Needs action": "Requer ação",
  Unfulfilled: "Por expedir",
  Unpaid: "Por pagar",
  Returns: "Devoluções",
};

export type OrderRow = {
  id: string;
  date: string;
  customer: string;
  payment: "Paid" | "Pending" | "Refunded";
  total: string;
  items: string;
  fulfillment: "Fulfilled" | "Returned" | "Unfulfilled";
};
