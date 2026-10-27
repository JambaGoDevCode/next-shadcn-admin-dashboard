import type { ReactNode } from "react";

import { getSessionTokens } from "@/lib/auth/session";

import { checkApiHealth } from "../../_components/api-health";
import { ApiStatusHeader } from "../../_components/api-status-header";

export type FinanceView =
  | "overview"
  | "transactions"
  | "bookings"
  | "store"
  | "commissions"
  | "refunds"
  | "reconciliation"
  | "reports";

const viewCopy: Record<FinanceView, { title: string; description: string }> = {
  overview: {
    title: "Visão financeira",
    description: "Resumo de receitas, volume transacionado, comissões e valores pendentes.",
  },
  transactions: {
    title: "Transações",
    description: "Consulte pagamentos, referências, origem, estado e data.",
  },
  bookings: {
    title: "Reservas e pagamentos",
    description: "Consulte a situação financeira associada às reservas de campos.",
  },
  store: {
    title: "Loja e pagamentos",
    description: "Consulte os pagamentos relacionados com as encomendas da loja.",
  },
  commissions: {
    title: "Comissões",
    description: "Valores cobrados pela plataforma, conforme o modelo de negócio.",
  },
  refunds: {
    title: "Reembolsos",
    description: "Analise e acompanhe as devoluções financeiras autorizadas.",
  },
  reconciliation: {
    title: "Reconciliação",
    description: "Compare os registos internos com os dados do fornecedor de pagamento.",
  },
  reports: {
    title: "Relatórios financeiros",
    description: "Exporte movimentos e resumos por período, estado e tipo.",
  },
};

interface FinanceShellProps {
  view: FinanceView;
  children: ReactNode;
}

/** Cabeçalho partilhado das secções do módulo Financeiro. */
export async function FinanceShell({ view, children }: FinanceShellProps) {
  const { accessToken } = await getSessionTokens();
  const apiOk = await checkApiHealth(accessToken ?? "");
  const copy = viewCopy[view];

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <ApiStatusHeader title={copy.title} description={copy.description} apiFailed={!apiOk} />
      {children}
    </div>
  );
}
