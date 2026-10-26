import { getSessionTokens } from "@/lib/auth/session";

import { checkApiHealth } from "../../_components/api-health";
import { ApiStatusHeader } from "../../_components/api-status-header";
import { ReservationsAdmin } from "./reservations-admin";

export type ReservationsView = "all" | "pending" | "confirmed" | "cancellations" | "conflicts" | "calendar";

const viewCopy: Record<ReservationsView, { title: string; description: string }> = {
  all: {
    title: "Todas as reservas",
    description: "Consulte reservas por referência, campo, cliente, data e estado.",
  },
  pending: {
    title: "Reservas pendentes",
    description: "Acompanhe reservas que aguardam confirmação ou pagamento.",
  },
  confirmed: {
    title: "Reservas confirmadas",
    description: "Consulte reservas válidas e respectivos detalhes.",
  },
  cancellations: {
    title: "Cancelamentos",
    description: "Consulte reservas canceladas e os dados de auditoria disponíveis.",
  },
  conflicts: {
    title: "Conflitos e incidentes",
    description: "Identifique sobreposições de horários entre reservas do mesmo campo.",
  },
  calendar: {
    title: "Calendário de reservas",
    description: "Visualize reservas por campo e por dia, semana ou mês.",
  },
};

interface ReservationsPageProps {
  view: ReservationsView;
}

export async function ReservationsPage({ view }: ReservationsPageProps) {
  const { accessToken } = await getSessionTokens();
  const apiOk = await checkApiHealth(accessToken ?? "");
  const copy = viewCopy[view];

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <ApiStatusHeader title={copy.title} description={copy.description} apiFailed={!apiOk} />
      <ReservationsAdmin view={view} />
    </div>
  );
}
