import { getConversionsOverview, getMetricsOverview, getStoreOverview } from "@/lib/api/resources";
import type { ConversionsOverview, MetricsOverview, StoreOverview } from "@/lib/api/types";
import { getSessionTokens } from "@/lib/auth/session";

import { FinancialIndicators } from "../_components/financial-indicators";
import { createLoader } from "../_components/load-resource";
import { ApiStatusHeader } from "../../_components/api-status-header";

export default async function PeladeiroFinancePage() {
  const { accessToken } = await getSessionTokens();
  const load = createLoader(accessToken ?? "");

  const [metrics, conversions, store] = await Promise.all([
    load<MetricsOverview>(getMetricsOverview),
    load<ConversionsOverview>((t) => getConversionsOverview(t, 30)),
    load<StoreOverview>((t) => getStoreOverview(t, 30)),
  ]);

  const anyFailed = [metrics, conversions, store].some((state) => state.failed);

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <ApiStatusHeader
        title="Indicadores financeiros"
        description="Peladeiro Dashboard — volume transacionado, receitas, comissões, pagamentos pendentes e reembolsos."
        apiFailed={anyFailed}
      />
      <FinancialIndicators metrics={metrics} conversions={conversions} store={store} />
    </div>
  );
}
