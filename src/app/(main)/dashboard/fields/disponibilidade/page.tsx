import { getSessionTokens } from "@/lib/auth/session";

import { checkApiHealth } from "../../_components/api-health";
import { ApiStatusHeader } from "../../_components/api-status-header";
import { FieldAvailabilityAdmin } from "./_components/field-availability-admin";

export default async function FieldAvailabilityPage() {
  const { accessToken } = await getSessionTokens();
  const apiOk = await checkApiHealth(accessToken ?? "");

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <ApiStatusHeader
        title="Disponibilidade"
        description="Consultar horários, bloqueios, indisponibilidades e conflitos de agenda."
        apiFailed={!apiOk}
      />
      <FieldAvailabilityAdmin />
      <p className="text-muted-foreground text-xs">
        Nota: horários e indisponibilidades são consultados a partir das reservas (GET /bookings) e do estado
        operacional do campo (PUT /fields/:id) — a API não expõe ainda um endpoint dedicado de calendário/blocos.
      </p>
    </div>
  );
}
